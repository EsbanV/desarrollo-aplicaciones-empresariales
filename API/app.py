from flask import Flask
from flask_cors import CORS # Importante para conectar con React
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from models import db, Usuario, Empresa, Impresora
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
    
    # Creación de dos usuarios base si la base está en blanco
    if not Usuario.query.first():
        print("Creando usuarios por defecto...")
        admin = Usuario(username="admin", password_hash=generate_password_hash("admin123"))
        socio = Usuario(username="socio", password_hash=generate_password_hash("socio123"))
        db.session.add(admin)
        db.session.add(socio)
        db.session.commit()
        print("Usuarios creados: admin/admin123 y socio/socio123")

    # Creación de Empresas e Impresoras de prueba
    if not Empresa.query.first():
        print("Poblando base de datos con datos de prueba...")
        empresa1 = Empresa(rut="76.123.456-7", razon_social="TechCorp SpA", giro="Desarrollo de Software")
        empresa2 = Empresa(rut="77.987.654-3", razon_social="Logistica Sur Ltda.", giro="Transporte y Logística")
        empresa3 = Empresa(rut="78.111.222-1", razon_social="Retail Mágico S.A.", giro="Bienes de Consumo")
        db.session.add_all([empresa1, empresa2, empresa3])
        db.session.commit()

        impresora1 = Impresora(serial="HP-LJET-001", modelo="HP LaserJet Pro", valor_arriendo=25000, empresa_id=empresa1.id, estado="Arrendada")
        impresora2 = Impresora(serial="BR-HL23-550", modelo="Brother HL-L2350DW", valor_arriendo=15000, empresa_id=empresa1.id, estado="Arrendada")
        impresora3 = Impresora(serial="EP-Ecot-990", modelo="Epson EcoTank L3250", valor_arriendo=18000, empresa_id=empresa2.id, estado="Arrendada")
        impresora4 = Impresora(serial="CN-MPX-4001", modelo="Canon MAXIFY GX4010", valor_arriendo=30000, estado="Disponible")
        impresora5 = Impresora(serial="CN-MPX-4002", modelo="Canon MAXIFY GX4010", valor_arriendo=30000, estado="Disponible")
        impresora6 = Impresora(serial="KM-BIZH-224", modelo="Konica Minolta Bizhub 224e", valor_arriendo=75000, estado="Disponible")

        db.session.add_all([impresora1, impresora2, impresora3, impresora4, impresora5, impresora6])
        db.session.commit()
        print("Base de datos poblada exitosamente.")

if __name__ == '__main__':
    app.run(debug=True, port=5000)