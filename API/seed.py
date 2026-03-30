import json
from app import create_app
from extensions import db
from models import Usuario

app = create_app()

def seed_database():
    with app.app_context():
        # 1. Limpiar la tabla (opcional, cuidado en producción)
        db.drop_all()
        db.create_all()

        # 2. Cargar el JSON
        import os
        base_dir = os.path.abspath(os.path.dirname(__file__))
        json_path = os.path.join(base_dir, 'usuarios_init.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            usuarios_data = json.load(f)

        # 3. Inyectar cada usuario
        for data in usuarios_data:
            nuevo_usuario = Usuario(
                id=data['id'],
                nombre=data['nombre'],
                email=data['email'],
                rol=data['rol']
            )
            db.session.add(nuevo_usuario)

        db.session.commit()
        print("✅ ¡Base de datos inicializada con 20 usuarios!")

if __name__ == "__main__":
    seed_database()