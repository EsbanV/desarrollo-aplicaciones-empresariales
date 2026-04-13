import logging
from datetime import datetime, date
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required
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


def sync_contract_statuses():
    """Sincroniza estado de contrato segun fecha_termino.
    - Vencido: fecha_termino menor a hoy
    - Arrendada: fecha_termino hoy o futura
    """
    today = date.today()
    changed = False

    impresoras_contrato = Impresora.query.filter(
        Impresora.empresa_id.isnot(None),
        Impresora.fecha_termino.isnot(None)
    ).all()

    for impresora in impresoras_contrato:
        try:
            end_date = datetime.strptime(impresora.fecha_termino, '%Y-%m-%d').date()
        except (TypeError, ValueError):
            continue

        new_status = 'Vencido' if end_date < today else 'Arrendada'
        if impresora.estado != new_status:
            impresora.estado = new_status
            changed = True

    if changed:
        db.session.commit()

# ==========================================
# RUTAS DE AUTENTICACIÓN
# ==========================================

@api_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
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
        data = request.json
        logger.info(f"Añadiendo nueva empresa: {data}")
        
        if not data or 'rut' not in data or 'razon_social' not in data:
            return jsonify({"error": "Faltan campos requeridos: 'rut' y 'razon_social'"}), 400
            
        if Empresa.query.filter_by(rut=data['rut']).first():
            return jsonify({"error": "Ya existe una empresa registrada con ese RUT"}), 400
            
        nueva_empresa = Empresa(
            rut=data['rut'], 
            razon_social=data['razon_social'],
            direccion_casa_matriz=data.get('direccion_casa_matriz'),
            giro=data.get('giro')
        )
        db.session.add(nueva_empresa)
        db.session.commit()
        return jsonify(nueva_empresa.to_dict()), 201
    except Exception as e:
        logger.error(f"Error en POST /empresas: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500

@api_bp.route('/empresas/<int:id>', methods=['PUT'])
@jwt_required()
def update_empresa(id):
    try:
        logger.info(f"Actualizando empresa ID: {id}")
        empresa = Empresa.query.get(id)
        if not empresa:
            return jsonify({"error": "Empresa no encontrada"}), 404

        data = request.json
        if 'rut' in data:
            empresa.rut = data['rut']
        if 'razon_social' in data:
            empresa.razon_social = data['razon_social']
        if 'direccion_casa_matriz' in data:
            empresa.direccion_casa_matriz = data['direccion_casa_matriz']
        if 'giro' in data:
            empresa.giro = data['giro']

        db.session.commit()
        return jsonify(empresa.to_dict()), 200
    except Exception as e:
        logger.error(f"Error en PUT /empresas/{id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500

@api_bp.route('/empresas/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_empresa(id):
    try:
        logger.info(f"Eliminando empresa ID: {id}")
        empresa = Empresa.query.get(id)
        if not empresa:
            return jsonify({"error": "Empresa no encontrada"}), 404

        for impresora in empresa.activos:
            impresora.empresa_id = None
            impresora.estado = 'Disponible'
            impresora.fecha_inicio = None
            impresora.fecha_termino = None

        db.session.delete(empresa)
        db.session.commit()
        return jsonify({"message": "Empresa eliminada exitosamente"}), 200
    except Exception as e:
        logger.error(f"Error en DELETE /empresas/{id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500


# ==========================================
# RUTAS PARA IMPRESORAS
# ==========================================

@api_bp.route('/impresoras', methods=['GET'])
@jwt_required()
def get_impresoras():
    try:
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
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500

@api_bp.route('/impresoras/stats', methods=['GET'])
@jwt_required()
def get_impresoras_stats():
    try:
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
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500

@api_bp.route('/impresoras/modelos', methods=['GET'])
@jwt_required()
def get_modelos():
    try:
        logger.info("Obteniendo lista de modelos únicos")
        # Obtenemos valores únicos de la columna modelo
        resultado = db.session.query(Impresora.modelo).distinct().all()
        modelos = [fila[0] for fila in resultado if fila[0]] # desempaquetamos la tupla y filtramos vacíos
        return jsonify(modelos)
    except Exception as e:
        logger.error(f"Error en GET /impresoras/modelos: {str(e)}")
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500

@api_bp.route('/impresoras', methods=['POST'])
@jwt_required()
def add_impresora():
    try:
        data = request.json
        logger.info(f"Añadiendo nueva impresora: {data}")
        
        if not data or 'serial' not in data or 'modelo' not in data:
            return jsonify({"error": "Faltan campos requeridos: 'serial' y 'modelo'"}), 400
            
        if Impresora.query.filter_by(serial=data['serial']).first():
            return jsonify({"error": "El serial ya está registrado para otra impresora"}), 400

        nueva_impresora = Impresora(
            serial=data['serial'], 
            modelo=data['modelo'],
            estado=data.get('estado', 'Disponible'),
            fecha_inicio=data.get('fecha_inicio'),
            fecha_termino=data.get('fecha_termino'),
            valor_arriendo=data.get('valor_arriendo', 0),
            empresa_id=data.get('empresa_id')
        )
        db.session.add(nueva_impresora)
        db.session.commit()
        return jsonify(nueva_impresora.to_dict()), 201
    except Exception as e:
        logger.error(f"Error en POST /impresoras: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500

@api_bp.route('/impresoras/<int:id>', methods=['PUT'])
@jwt_required()
def update_impresora(id):
    try:
        logger.info(f"Actualizando impresora ID: {id}")
        impresora = Impresora.query.get(id)
        if not impresora:
            return jsonify({"error": "Impresora no encontrada"}), 404

        data = request.json
        
        if 'serial' in data:
            impresora.serial = data['serial']
        if 'modelo' in data:
            impresora.modelo = data['modelo']
        new_estado = data.get('estado', impresora.estado)
        new_empresa_id = data.get('empresa_id', impresora.empresa_id)

        is_out_of_service = new_estado in ['Fuera de Servicio', 'En Servicio']

        # Regla de negocio: un equipo fuera de servicio no puede estar asignado.
        if is_out_of_service and new_empresa_id is not None:
            return jsonify({"error": "Una impresora fuera de servicio no puede estar asignada a una empresa"}), 400

        # Regla de negocio: no se puede asignar una impresora fuera de servicio.
        if is_out_of_service and 'empresa_id' in data and data.get('empresa_id') is not None:
            return jsonify({"error": "No puedes arrendar una impresora fuera de servicio"}), 400

        # Normaliza el nombre de estado para mantener consistencia.
        if new_estado == 'En Servicio':
            new_estado = 'Fuera de Servicio'
            data['estado'] = 'Fuera de Servicio'

        if 'estado' in data:
            impresora.estado = data['estado']
        if 'fecha_inicio' in data:
            impresora.fecha_inicio = data['fecha_inicio']
        if 'fecha_termino' in data:
            impresora.fecha_termino = data['fecha_termino']
        if 'valor_arriendo' in data:
            impresora.valor_arriendo = data['valor_arriendo']
        if 'empresa_id' in data:
            impresora.empresa_id = data['empresa_id']

        # Si pasa a fuera de servicio, se limpia contrato y asignacion automaticamente.
        if new_estado == 'Fuera de Servicio':
            impresora.empresa_id = None
            impresora.fecha_inicio = None
            impresora.fecha_termino = None

        db.session.commit()
        return jsonify(impresora.to_dict()), 200
    except Exception as e:
        logger.error(f"Error en PUT /impresoras/{id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500

@api_bp.route('/impresoras/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_impresora(id):
    try:
        logger.info(f"Eliminando impresora ID: {id}")
        impresora = Impresora.query.get(id)
        if not impresora:
            return jsonify({"error": "Impresora no encontrada"}), 404

        db.session.delete(impresora)
        db.session.commit()
        return jsonify({"message": "Impresora eliminada exitosamente"}), 200
    except Exception as e:
        logger.error(f"Error en DELETE /impresoras/{id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500
