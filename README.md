# Control de Inventario - Desarrollo de Aplicaciones Empresariales

**Equipo:** Esban Vejar y Camilo Darwitg

## Descripción

Plataforma B2B Ágil Empresarial diseñada para gestionar el inventario, arriendo y stock de un gran volumen de impresoras corporativas. La aplicación permite administrar de forma segura los equipos tecnológicos, asignar unidades en arriendo a diversas empresas socias, observar el estado en tiempo real, e interactuar con un Dashboard estadístico general de salud del inventario.

Cuenta con un diseño **Premium Dark/Glassmorphism** y una arquitectura asíncrona totalmente desacoplada, garantizando un alto rendimiento y escalabilidad progresiva. Todo bajo un ambiente estrictamente protegido mediante Autenticación **JWT (JSON Web Tokens)**.

---

## Funcionalidades Principales

- **Dashboard de Métricas**: Paneles de control generados en tiempo real directo desde la base de datos (conteo absoluto, equipos listos para ser desplegados y desglose de disponibilidad por marca y modelo).
- **Gestión Inmobiliaria**:
  - Inventario de Impresoras (Serial, Modelo, Precio de Arriendo mensual).
  - Directorio de Empresas/Socios (RUT, Razón Social, Giro industrial).
- **Control de Estado de Maquinaría**: Auto-evaluación del estado logístico de cada impresora. Se etiqueta automáticamente en `"Arrendada"` o `"Disponible"` dependiendo si se ha asignado a una Empresa o no.
- **Buscadores y Filtros en Tiempo Real**: Capacidad de clasificar impresoras registradas en base a su modelo, la empresa que los custodia, o buscando dinámicamente por número de Serie con carga instantánea.
- **Autenticación Protegida**: Interfaz de inicio de sesión seguro conectada con el Backend mediante cifrado JWT. Acceso restringido para modificaciones.
- **Siembra Automática (Auto-seeding)**: Para facilitar el despliegue técnico, la plataforma poblara inicialmente una base de datos local prefabricada con inventario de muestras la primera vez que se ejecute el sistema de arrranque.

---

## Stack Tecnológico 

### Frontend (User Interface)
- **React 18** + **TypeScript**
- **Vite** (Module Bundler veloz)
- **Tailwind CSS** (Motor de diseño adaptativo y variables lógicas oscuras de cristalomorfismo).
- **Lucide React** (Iconografía ligera y escalable).
- **Axios** (Conexion HTTP interceptada para tokenización JWT).

### Backend (Core Server & API REST)
- **Python 3.10+**
- **Flask** (Micro-framework asíncrono)
- **Flask-SQLAlchemy** (ORM relacional para manipulación unificada en SQL).
- **Flask-JWT-Extended** (Capa de seguridad de autorización por tokens).
- **Flask-CORS** (Políticas de origen cruzado para React).
- **SQLite** (Integración embebida y liviana de base de datos)

---

## Requisitos previos

- Python 3.10 o superior.
- Node.js 18 o superior.
- npm o yarn.

---

## Instalación y Ejecución Local

Dado el fuerte aislamiento por capas, necesitarás 2 terminales/focos activos:

### 1. Iniciar Servidor API Backend

cd API
python -m venv venv

# Activación del entorno virtual (Windows)
venv\Scripts\activate

# Instalar dependecias
pip install -r ..\requirements.txt

# Ejecutar el servidor (creará la DB 'database.db' y generará credenciales y datos iniciales automáticamente)
python app.py

> El motor escuchará en el ecosistema local `http://localhost:5000`

### 2. Iniciar Plataforma Frontend

Abre otra pestaña de terminal distinta, y dirígete al entorno frontend:

cd frontend

# Instalar árbol de dependencias JS/TS
npm install

# Levantar hot-server de Vite
npm run dev

> El cliente web escuchará en `http://localhost:5173`

---

## Mapeo General API REST

Base URL predeterminada: `http://localhost:5000/api`

### Capa de Autenticación
- `POST /login`: Autorización por credencial maestra local (entrega Bearer Token administrativo).

### Capa de Información Estadística
- `GET /impresoras/stats`: Consume de forma rápida las agregaciones y promedios transaccionales de los equipos en terreno desde un subproceso de bases SQL.

### Capa de Impresoras (Protegidos por JWT)
- `GET /impresoras`: Obtiene catálogo de hardware. Admite query-params dinámicas (`?serial=XXX&modelo=YYY&empresa_id=1`).
- `POST /impresoras`: Añade un activo.
- `PUT /impresoras/<id>`: Actualiza atributos o asignaciones empresariales de un activo.
- `DELETE /impresoras/<id>`: Remueve del log.

### Capa de Empresas (Protegidos por JWT)
- `GET /empresas`: Listado de asociaciones y socios de arrendo (Incluyendo recuentos de items físicos encomendados por cada una).
- `POST /empresas`: Asignaciones fiscales (Rut, Razon Social).
- `PUT /empresas/<id>`: Modificación fiscal o corrección.
- `DELETE /empresas/<id>`: Desvincular de la infraestructura. *(Solo factible si ninguna impresora depende de ella)*.

---

## Licencia

Proyecto diseñado para un entorno académico. Todos los derechos reservados.