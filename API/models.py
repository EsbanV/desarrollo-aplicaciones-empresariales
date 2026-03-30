from extensions import db

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    rol = db.Column(db.String(50), nullable=False, default='Usuario')

    def to_dict(self):
        return {"id": self.id, "nombre": self.nombre, "email": self.email, "rol": self.rol}
