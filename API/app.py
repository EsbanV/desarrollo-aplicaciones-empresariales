from flask import Flask
from flask_cors import CORS # Importante para conectar con React
from models import db
from routes.productos import api_bp

app = Flask(__name__)
CORS(app) # Permite que tu frontend en React acceda a la API

# Configuración
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicialización
db.init_app(app)

# Registro de Rutas
app.register_blueprint(api_bp, url_prefix='/api')

# Creación automática de tablas
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)