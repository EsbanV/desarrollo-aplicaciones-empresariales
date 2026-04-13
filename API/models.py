from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username
        }

class Empresa(db.Model):
    __tablename__ = 'empresas'
    id = db.Column(db.Integer, primary_key=True)
    rut = db.Column(db.String(12), unique=True, nullable=False)
    razon_social = db.Column(db.String(150), nullable=False)
    direccion_casa_matriz = db.Column(db.String(200))
    giro = db.Column(db.String(100)) # Importante para facturación empresarial
    
    # Relación con las impresoras arrendadas
    activos = db.relationship('Impresora', backref='empresa_cliente', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "rut": self.rut,
            "razon_social": self.razon_social,
            "cant_equipos": len(self.activos),
            "giro": self.giro
        }

class Impresora(db.Model):
    __tablename__ = 'impresoras'
    id = db.Column(db.Integer, primary_key=True)
    serial = db.Column(db.String(50), unique=True, nullable=False)
    modelo = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(20), default='Disponible')
    fecha_inicio = db.Column(db.String(10), nullable=True)
    fecha_termino = db.Column(db.String(10), nullable=True)
    
    # NUEVO: Valor de arriendo mensual (usamos Integer o Numeric)
    valor_arriendo = db.Column(db.Integer, default=0) 
    
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "serial": self.serial,
            "modelo": self.modelo,
            "estado": self.estado,
            "fecha_inicio": self.fecha_inicio,
            "fecha_termino": self.fecha_termino,
            "valor_arriendo": self.valor_arriendo,
            "empresa_id": self.empresa_id,
            "cliente_actual": self.empresa_cliente.razon_social if self.empresa_id and self.empresa_cliente else "STOCK"
        }