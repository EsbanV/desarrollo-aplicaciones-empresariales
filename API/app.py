from flask import Flask
from config import Config
from extensions import db
from routes.usuarios import usuarios_bp
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(Config)

    # Inicializar la base de datos de manera limpia a través de extensions
    db.init_app(app)

    # Registrar el Blueprint de usuarios
    app.register_blueprint(usuarios_bp, url_prefix='/api/v1/usuarios')

    # Crear las tablas si no existen
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)