from flask import Flask
from flask_cors import CORS # Importante para conectar con React
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from sqlalchemy import inspect, text
from models import db, Usuario
from routes.api import api_bp

app = Flask(__name__)
CORS(app) # Permite que tu frontend en React acceda a la API

# Configuración
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = "tu-super-clave-secreta-ultra-segura" 
jwt = JWTManager(app)

# Inicialización
db.init_app(app)

# Registro de Rutas
app.register_blueprint(api_bp, url_prefix='/api')

# Creación automática de tablas y sembrado
with app.app_context():
    db.create_all()

    inspector = inspect(db.engine)
    if 'impresoras' in inspector.get_table_names():
        existing_columns = {column['name'] for column in inspector.get_columns('impresoras')}
        with db.engine.begin() as connection:
            if 'fecha_inicio' not in existing_columns:
                connection.execute(text("ALTER TABLE impresoras ADD COLUMN fecha_inicio VARCHAR(10)"))
            if 'fecha_termino' not in existing_columns:
                connection.execute(text("ALTER TABLE impresoras ADD COLUMN fecha_termino VARCHAR(10)"))
    
    # Creación de dos usuarios base si la base está en blanco
    if not Usuario.query.first():
        print("Creando usuarios por defecto...")
        admin = Usuario(username="admin", password_hash=generate_password_hash("admin123"))
        socio = Usuario(username="socio", password_hash=generate_password_hash("socio123"))
        db.session.add(admin)
        db.session.add(socio)
        db.session.commit()
        print("Usuarios creados: admin/admin123 y socio/socio123")

if __name__ == '__main__':
    app.run(debug=True, port=5000)