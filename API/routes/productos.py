from flask import Blueprint, jsonify, request
from models import db, Producto

# Creamos un Blueprint para organizar las rutas
api_bp = Blueprint('api', __name__)

@api_bp.route('/productos', methods=['GET'])
def get_productos():
    productos = Producto.query.all()
    return jsonify([p.to_dict() for p in productos])

@api_bp.route('/productos', methods=['POST'])
def add_producto():
    data = request.json
    
    if not data or 'nombre' not in data or 'stock' not in data:
        return jsonify({"error": "Faltan campos requeridos: 'nombre' y 'stock'"}), 400
        
    if int(data['stock']) < 0:
        return jsonify({"error": "El stock no puede ser negativo"}), 400
        
    nuevo_prod = Producto(nombre=data['nombre'], stock=int(data['stock']))
    db.session.add(nuevo_prod)
    db.session.commit()
    return jsonify(nuevo_prod.to_dict()), 201

@api_bp.route('/productos/<int:id>', methods=['PUT'])
def update_producto(id):
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({"error": "Producto no encontrado"}), 404

    data = request.json
    if 'nombre' in data:
        producto.nombre = data['nombre']
    if 'stock' in data:
        if int(data['stock']) < 0:
            return jsonify({"error": "El stock no puede ser negativo"}), 400
        producto.stock = int(data['stock'])

    db.session.commit()
    return jsonify(producto.to_dict()), 200

@api_bp.route('/productos/<int:id>', methods=['DELETE'])
def delete_producto(id):
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({"error": "Producto no encontrado"}), 404

    db.session.delete(producto)
    db.session.commit()
    return jsonify({"message": "Producto eliminado exitosamente"}), 200