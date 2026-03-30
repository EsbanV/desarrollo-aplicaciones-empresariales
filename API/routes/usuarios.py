from flask import Blueprint, jsonify, request
from models import Usuario
from extensions import db

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/', methods=['GET'], strict_slashes=False)
def get_usuarios():
    usuarios = Usuario.query.all()
    return jsonify([u.to_dict() for u in usuarios]), 200

@usuarios_bp.route('/', methods=['POST'], strict_slashes=False)
def create_usuario():
    data = request.get_json()
    if not data or not 'nombre' in data or not 'email' in data:
        return jsonify({"error": "Faltan datos (se requiere nombre y email)"}), 400
    
    # Verificar si el correo ya existe
    if Usuario.query.filter_by(email=data['email']).first():
        return jsonify({"error": "El email ya está registrado"}), 409

    nuevo_usuario = Usuario(nombre=data['nombre'], email=data['email'])
    db.session.add(nuevo_usuario)
    db.session.commit()

    return jsonify(nuevo_usuario.to_dict()), 201
