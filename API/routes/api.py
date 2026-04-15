import logging
import re
from datetime import datetime, date
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash
from sqlalchemy import func, case
from models import db, Empresa, Impresora, Usuario

# Configurar logs
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

# Creamos un Blueprint general para la API
api_bp = Blueprint('api', __name__)

VALID_PRINTER_STATES = {'Disponible', 'Arrendada', 'Vencido', 'Fuera de Servicio', 'En Servicio'}


def normalize_rut(value):
    if value is None:
        return None, "El campo 'rut' es obligatorio"

    cleaned = re.sub(r'[\.\-\s]', '', str(value)).strip().upper()
    if len(cleaned) != 9:
        return None, "El RUT debe tener 8 dígitos más dígito verificador"

    body, dv = cleaned[:-1], cleaned[-1]
    if not body.isdigit():
        return None, "El RUT debe tener 8 dígitos numéricos antes del dígito verificador"

    if not (dv.isdigit() or dv == 'K'):
        return None, "El dígito verificador del RUT debe ser un número o K"

    return f"{body}-{dv}", None


def _clean_text(value, field_name, min_length=1):
    if value is None:
        return None, f"El campo '{field_name}' es obligatorio"

    text = str(value).strip()
    if len(text) < min_length:
        return None, f"El campo '{field_name}' es obligatorio"

    return text, None


def _rut_exists(rut, exclude_id=None):
    query = Empresa.query
    if exclude_id is not None:
        query = query.filter(Empresa.id != exclude_id)

    for empresa in query.all():
        existing_rut, error = normalize_rut(empresa.rut)
        if error:
            continue
        if existing_rut == rut:
            return True

    return False


def _parse_optional_date(value, field_name):
    if value in (None, ''):
        return None, None

    if not isinstance(value, str):
        return None, f"El campo '{field_name}' debe tener formato YYYY-MM-DD"

    try:
        parsed = datetime.strptime(value, '%Y-%m-%d').date()
        return parsed, None
    except ValueError:
        return None, f"El campo '{field_name}' debe tener formato YYYY-MM-DD"


def _validate_contract_dates(fecha_inicio, fecha_termino):
    start_date, start_error = _parse_optional_date(fecha_inicio, 'fecha_inicio')
    if start_error:
        return start_error

    end_date, end_error = _parse_optional_date(fecha_termino, 'fecha_termino')
    if end_error:
        return end_error

    if start_date and end_date and end_date <= start_date:
        return 'La fecha_termino debe ser posterior a la fecha_inicio'

    return None


def _parse_optional_int(value, field_name):
    if value in (None, ''):
        return None, None

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None, f"El campo '{field_name}' debe ser un número entero"

    return parsed, None


def _parse_non_negative_int(value, field_name):
    parsed, error = _parse_optional_int(value, field_name)
    if error:
        return None, error

    if parsed is None:
        return 0, None

    if parsed < 0:
        return None, f"El campo '{field_name}' no puede ser negativo"

    return parsed, None


def _parse_optional_id(value, field_name):
    parsed, error = _parse_optional_int(value, field_name)
    if error:
        return None, error

    if parsed is None:
        return None, None

    if parsed <= 0:
        return None, f"El campo '{field_name}' debe ser mayor a 0"

    return parsed, None


def _require_active_user():
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "Token inválido"}), 401

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Token inválido"}), 401

    usuario = Usuario.query.get(user_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado o inactivo"}), 401

    return None


def sync_contract_statuses():
    """Sincroniza estado de contrato segun fecha_termino.
    - Vencido: fecha_termino menor a hoy
    - Arrendada: fecha_termino hoy o futura
    """
    today_str = date.today().isoformat()

    vencidas = Impresora.query.filter(
        Impresora.empresa_id.isnot(None),
        Impresora.fecha_termino.isnot(None),
        func.length(Impresora.fecha_termino) == 10,
        Impresora.fecha_termino < today_str,
        Impresora.estado != 'Fuera de Servicio'
    ).update({Impresora.estado: 'Vencido'}, synchronize_session=False)

    vigentes = Impresora.query.filter(
        Impresora.empresa_id.isnot(None),
        Impresora.fecha_termino.isnot(None),
        func.length(Impresora.fecha_termino) == 10,
        Impresora.fecha_termino >= today_str,
        Impresora.estado != 'Fuera de Servicio'
    ).update({Impresora.estado: 'Arrendada'}, synchronize_session=False)

    if vencidas or vigentes:
        db.session.commit()

# ==========================================
# RUTAS DE AUTENTICACIÓN
# ==========================================

@api_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Faltan credenciales"}), 400
            
        usuario = Usuario.query.filter_by(username=username).first()
        
        if not usuario or not check_password_hash(usuario.password_hash, password):
            return jsonify({"error": "Credenciales inválidas"}), 401
            
        # Generar token si es exitoso
        access_token = create_access_token(identity=str(usuario.id))
        return jsonify(access_token=access_token, username=usuario.username), 200
        
    except Exception as e:
        logger.error(f"Error en POST /login: {str(e)}")
        return jsonify({"error": "Error interno"}), 500


# ==========================================
# RUTAS PARA EMPRESAS
# ==========================================

@api_bp.route('/empresas', methods=['GET'])
@jwt_required()
def get_empresas():
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        logger.info("Obteniendo lista de empresas")
        empresas = Empresa.query.all()
        return jsonify([e.to_dict() for e in empresas])
    except Exception as e:
        logger.error(f"Error en GET /empresas: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500

@api_bp.route('/empresas', methods=['POST'])
@jwt_required()
def add_empresa():
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        data = request.get_json(silent=True) or {}
        logger.info(f"Añadiendo nueva empresa: {data}")

        rut, rut_error = _clean_text(data.get('rut'), 'rut')
        if rut_error:
            return jsonify({"error": rut_error}), 400

        rut, rut_error = normalize_rut(rut)
        if rut_error:
            return jsonify({"error": rut_error}), 400

        razon_social, razon_social_error = _clean_text(data.get('razon_social'), 'razon_social')
        if razon_social_error:
            return jsonify({"error": razon_social_error}), 400

        giro = data.get('giro')
        if giro is not None:
            giro = str(giro).strip() or None

        direccion_casa_matriz = data.get('direccion_casa_matriz')
        if direccion_casa_matriz is not None:
            direccion_casa_matriz = str(direccion_casa_matriz).strip() or None

        if _rut_exists(rut):
            return jsonify({"error": "Ya existe una empresa registrada con ese RUT"}), 400
            
        nueva_empresa = Empresa(
            rut=rut,
            razon_social=razon_social,
            direccion_casa_matriz=direccion_casa_matriz,
            giro=giro
        )
        db.session.add(nueva_empresa)
        db.session.commit()
        return jsonify(nueva_empresa.to_dict()), 201
    except Exception as e:
        logger.error(f"Error en POST /empresas: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500

@api_bp.route('/empresas/<int:id>', methods=['PUT'])
@jwt_required()
def update_empresa(id):
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        logger.info(f"Actualizando empresa ID: {id}")
        empresa = Empresa.query.get(id)
        if not empresa:
            return jsonify({"error": "Empresa no encontrada"}), 404

        data = request.get_json(silent=True) or {}
        if not data:
            return jsonify({"error": "No se enviaron datos para actualizar"}), 400

        if 'rut' in data:
            rut, rut_error = _clean_text(data.get('rut'), 'rut')
            if rut_error:
                return jsonify({"error": rut_error}), 400

            rut, rut_error = normalize_rut(rut)
            if rut_error:
                return jsonify({"error": rut_error}), 400

            if _rut_exists(rut, exclude_id=id):
                return jsonify({"error": "Ya existe una empresa registrada con ese RUT"}), 400

            empresa.rut = rut
        if 'razon_social' in data:
            razon_social, razon_social_error = _clean_text(data.get('razon_social'), 'razon_social')
            if razon_social_error:
                return jsonify({"error": razon_social_error}), 400
            empresa.razon_social = razon_social
        if 'direccion_casa_matriz' in data:
            direccion = data.get('direccion_casa_matriz')
            empresa.direccion_casa_matriz = str(direccion).strip() if direccion not in (None, '') else None
        if 'giro' in data:
            giro = data.get('giro')
            empresa.giro = str(giro).strip() if giro not in (None, '') else None

        db.session.commit()
        return jsonify(empresa.to_dict()), 200
    except Exception as e:
        logger.error(f"Error en PUT /empresas/{id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500

@api_bp.route('/empresas/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_empresa(id):
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        logger.info(f"Eliminando empresa ID: {id}")
        empresa = Empresa.query.get(id)
        if not empresa:
            return jsonify({"error": "Empresa no encontrada"}), 404

        if empresa.activos:
            return jsonify({"error": "No se puede eliminar la empresa porque tiene impresoras asociadas. Primero use la acción de desligar activos."}), 400

        db.session.delete(empresa)
        db.session.commit()
        return jsonify({"message": "Empresa eliminada exitosamente"}), 200
    except Exception as e:
        logger.error(f"Error en DELETE /empresas/{id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500


@api_bp.route('/empresas/<int:id>/desligar_activos', methods=['POST'])
@api_bp.route('/empresas/<int:id>/desligar', methods=['POST'])
@jwt_required()
def desligar_activos_empresa(id):
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        empresa = Empresa.query.get(id)
        if not empresa:
            return jsonify({"error": "Empresa no encontrada"}), 404

        activos = Impresora.query.filter(Impresora.empresa_id == id).update(
            {
                Impresora.empresa_id: None,
                Impresora.estado: 'Disponible',
                Impresora.fecha_inicio: None,
                Impresora.fecha_termino: None,
            },
            synchronize_session=False
        )

        db.session.commit()
        return jsonify({
            "message": "Activos desligados exitosamente",
            "impresoras_desligadas": activos
        }), 200
    except Exception as e:
        logger.error(f"Error en POST /empresas/{id}/desligar_activos: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500


# ==========================================
# RUTAS PARA IMPRESORAS
# ==========================================

@api_bp.route('/impresoras', methods=['GET'])
@jwt_required()
def get_impresoras():
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        sync_contract_statuses()
        logger.info("Obteniendo lista de impresoras filtrada")
        serial_filter = request.args.get('serial')
        modelo_filter = request.args.get('modelo')
        empresa_id_filter = request.args.get('empresa_id')

        query = Impresora.query

        if serial_filter:
            query = query.filter(Impresora.serial.ilike(f'%{serial_filter}%'))
        
        if modelo_filter:
            query = query.filter(Impresora.modelo == modelo_filter)
            
        if empresa_id_filter:
            if empresa_id_filter == 'unassigned':
                query = query.filter(Impresora.empresa_id == None)
            else:
                query = query.filter(Impresora.empresa_id == empresa_id_filter)

        impresoras = query.all()
        return jsonify([i.to_dict() for i in impresoras])
    except Exception as e:
        logger.error(f"Error en GET /impresoras: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500

@api_bp.route('/impresoras/stats', methods=['GET'])
@jwt_required()
def get_impresoras_stats():
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        sync_contract_statuses()
        logger.info("Obteniendo estadísticas de impresoras")
        total_equipos = Impresora.query.count()
        total_disponibles = Impresora.query.filter_by(estado='Disponible').count()
        total_en_servicio = Impresora.query.filter(
            Impresora.estado.in_(['Fuera de Servicio', 'En Servicio'])
        ).count()
        
        stats = db.session.query(
            Impresora.modelo,
            func.count(Impresora.id).label('total'),
            func.sum(case((Impresora.estado == 'Arrendada', 1), else_=0)).label('arrendadas'),
            func.sum(case((Impresora.estado == 'Disponible', 1), else_=0)).label('disponibles'),
            func.sum(case((Impresora.estado.in_(['Fuera de Servicio', 'En Servicio']), 1), else_=0)).label('en_servicio')
        ).group_by(Impresora.modelo).all()
        
        modelos_list = []
        for s in stats:
            modelos_list.append({
                "nombre": s.modelo,
                "total": s.total,
                "arrendadas": int(s.arrendadas) if s.arrendadas else 0,
                "disponibles": int(s.disponibles) if s.disponibles else 0,
                "en_servicio": int(s.en_servicio) if s.en_servicio else 0
            })
            
        return jsonify({
            "total_equipos": total_equipos,
            "total_disponibles": total_disponibles,
            "total_en_servicio": total_en_servicio,
            "modelos": modelos_list
        })
    except Exception as e:
        logger.error(f"Error en GET /impresoras/stats: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500

@api_bp.route('/impresoras/modelos', methods=['GET'])
@jwt_required()
def get_modelos():
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        logger.info("Obteniendo lista de modelos únicos")
        # Obtenemos valores únicos de la columna modelo
        resultado = db.session.query(Impresora.modelo).distinct().all()
        modelos = [fila[0] for fila in resultado if fila[0]] # desempaquetamos la tupla y filtramos vacíos
        return jsonify(modelos)
    except Exception as e:
        logger.error(f"Error en GET /impresoras/modelos: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500

@api_bp.route('/impresoras', methods=['POST'])
@jwt_required()
def add_impresora():
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        data = request.get_json(silent=True) or {}
        logger.info(f"Añadiendo nueva impresora: {data}")

        serial, serial_error = _clean_text(data.get('serial'), 'serial', min_length=5)
        if serial_error:
            return jsonify({"error": "El campo 'serial' es obligatorio y debe tener al menos 5 caracteres"}), 400

        modelo, modelo_error = _clean_text(data.get('modelo'), 'modelo')
        if modelo_error:
            return jsonify({"error": modelo_error}), 400

        estado = data.get('estado', 'Disponible')
        if estado not in VALID_PRINTER_STATES:
            return jsonify({"error": "Estado de impresora inválido"}), 400
        if estado == 'En Servicio':
            estado = 'Fuera de Servicio'

        fecha_error = _validate_contract_dates(data.get('fecha_inicio'), data.get('fecha_termino'))
        if fecha_error:
            return jsonify({"error": fecha_error}), 400

        valor_arriendo, valor_error = _parse_non_negative_int(data.get('valor_arriendo'), 'valor_arriendo')
        if valor_error:
            return jsonify({"error": valor_error}), 400

        empresa_id, empresa_id_error = _parse_optional_id(data.get('empresa_id'), 'empresa_id')
        if empresa_id_error:
            return jsonify({"error": empresa_id_error}), 400

        if empresa_id is not None and not Empresa.query.get(empresa_id):
            return jsonify({"error": "La empresa indicada no existe"}), 400

        if estado == 'Fuera de Servicio' and empresa_id is not None:
            return jsonify({"error": "Una impresora fuera de servicio no puede estar asignada a una empresa"}), 400

        if Impresora.query.filter_by(serial=serial).first():
            return jsonify({"error": "El serial ya está registrado para otra impresora"}), 400

        nueva_impresora = Impresora(
            serial=serial,
            modelo=modelo,
            estado=estado,
            fecha_inicio=data.get('fecha_inicio'),
            fecha_termino=data.get('fecha_termino'),
            valor_arriendo=valor_arriendo,
            empresa_id=empresa_id
        )

        if estado == 'Fuera de Servicio':
            nueva_impresora.empresa_id = None
            nueva_impresora.fecha_inicio = None
            nueva_impresora.fecha_termino = None

        db.session.add(nueva_impresora)
        db.session.commit()
        return jsonify(nueva_impresora.to_dict()), 201
    except Exception as e:
        logger.error(f"Error en POST /impresoras: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500

@api_bp.route('/impresoras/<int:id>', methods=['PUT'])
@jwt_required()
def update_impresora(id):
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        logger.info(f"Actualizando impresora ID: {id}")
        impresora = Impresora.query.get(id)
        if not impresora:
            return jsonify({"error": "Impresora no encontrada"}), 404

        data = request.get_json(silent=True) or {}
        if not data:
            return jsonify({"error": "No se enviaron datos para actualizar"}), 400
        
        if 'serial' in data:
            serial, serial_error = _clean_text(data.get('serial'), 'serial', min_length=5)
            if serial_error:
                return jsonify({"error": "El campo 'serial' es obligatorio y debe tener al menos 5 caracteres"}), 400

            if Impresora.query.filter(Impresora.serial == serial, Impresora.id != id).first():
                return jsonify({"error": "El serial ya está registrado para otra impresora"}), 400

            impresora.serial = serial
        if 'modelo' in data:
            modelo, modelo_error = _clean_text(data.get('modelo'), 'modelo')
            if modelo_error:
                return jsonify({"error": modelo_error}), 400
            impresora.modelo = modelo

        new_estado = data.get('estado', impresora.estado)
        if new_estado not in VALID_PRINTER_STATES:
            return jsonify({"error": "Estado de impresora inválido"}), 400

        new_empresa_id = impresora.empresa_id
        if 'empresa_id' in data:
            new_empresa_id, empresa_id_error = _parse_optional_id(data.get('empresa_id'), 'empresa_id')
            if empresa_id_error:
                return jsonify({"error": empresa_id_error}), 400

        next_fecha_inicio = data.get('fecha_inicio', impresora.fecha_inicio)
        next_fecha_termino = data.get('fecha_termino', impresora.fecha_termino)
        fecha_error = _validate_contract_dates(next_fecha_inicio, next_fecha_termino)
        if fecha_error:
            return jsonify({"error": fecha_error}), 400

        if 'valor_arriendo' in data:
            valor_arriendo, valor_error = _parse_non_negative_int(data.get('valor_arriendo'), 'valor_arriendo')
            if valor_error:
                return jsonify({"error": valor_error}), 400
            impresora.valor_arriendo = valor_arriendo

        # Normaliza el nombre de estado para mantener consistencia.
        if new_estado == 'En Servicio':
            new_estado = 'Fuera de Servicio'
            data['estado'] = 'Fuera de Servicio'

        if 'estado' in data:
            impresora.estado = new_estado
        if 'fecha_inicio' in data:
            impresora.fecha_inicio = next_fecha_inicio
        if 'fecha_termino' in data:
            impresora.fecha_termino = next_fecha_termino
        if 'empresa_id' in data:
            if new_estado == 'Fuera de Servicio' and new_empresa_id is not None and new_empresa_id != impresora.empresa_id:
                return jsonify({"error": "No puedes arrendar una impresora fuera de servicio"}), 400

            impresora.empresa_id = new_empresa_id

        # Si pasa a fuera de servicio, conserva la empresa pero pausa el contrato.
        if new_estado == 'Fuera de Servicio':
            impresora.estado = 'Fuera de Servicio'

        db.session.commit()
        return jsonify(impresora.to_dict()), 200
    except Exception as e:
        logger.error(f"Error en PUT /impresoras/{id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500

@api_bp.route('/impresoras/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_impresora(id):
    try:
        auth_error = _require_active_user()
        if auth_error:
            return auth_error

        logger.info(f"Eliminando impresora ID: {id}")
        impresora = Impresora.query.get(id)
        if not impresora:
            return jsonify({"error": "Impresora no encontrada"}), 404

        if impresora.empresa_id is not None:
            return jsonify({"error": "No se puede eliminar la impresora porque tiene una empresa asignada. Primero debes desligarla."}), 400

        db.session.delete(impresora)
        db.session.commit()
        return jsonify({"message": "Impresora eliminada exitosamente"}), 200
    except Exception as e:
        logger.error(f"Error en DELETE /impresoras/{id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor"}), 500
