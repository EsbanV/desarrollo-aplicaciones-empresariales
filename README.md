# Desarrollo de Aplicaciones Empresariales

## Tema 2: Control simple de inventario

**Equipo:** Esban Vejar y Camilo Darwitg

## Descripción

Aplicación web ligera para que una pequeña empresa pueda gestionar su stock en tiempo real. Permite registrar productos, consultar el inventario actualizado, aumentar o disminuir cantidades y mantener la información guardada para que no se pierda al recargar o cerrar el navegador.

## Funcionalidades

- Registrar un nuevo producto con su nombre y stock inicial.
- Mostrar una lista actualizada de todos los productos registrados.
- Aumentar el stock de un producto existente.
- Disminuir el stock de un producto cuando se registre una salida.
- Eliminar productos del inventario.
- Evitar que el stock sea un número negativo.
- Guardar la información en una base de datos local para mantenerla persistente.

## Requisitos funcionales cubiertos

- El sistema permite ingresar un nuevo producto con su nombre y una cantidad inicial de stock.
- El sistema muestra una lista actualizada de todos los productos registrados con sus cantidades actuales.
- El sistema permite aumentar el stock de un producto existente de manera simple.
- El sistema permite disminuir el stock de un producto cuando se registra una salida.
- La información se guarda en una base de datos SQLite local para conservar los datos entre recargas.

## Requisitos no funcionales cubiertos

- La interfaz está pensada para realizar operaciones de stock de forma rápida y simple.
- El backend valida que el stock nunca sea negativo.
- La aplicación actualiza el estado del inventario en la interfaz después de cada operación.

## Tecnologías utilizadas

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-CORS
- SQLite

### Frontend

- React
- TypeScript
- Vite
- Axios
- Tailwind CSS
- Lucide React

## Estructura del proyecto

```text
desarrollo-aplicaciones-empresariales/
├── API/
│   ├── app.py
│   ├── config.py
│   ├── docker-compose.yml
│   ├── extensions.py
│   ├── kong.yml
│   ├── models.py
│   └── routes/
│       └── productos.py
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── axiosConfig.ts
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   │   └── useInventory.ts
│   │   ├── pages/
│   │   │   └── InventoryPage.tsx
│   │   └── types/
│   │       └── inventory.ts
│   └── ...
├── README.md
└── requirements.txt
```

## Requisitos previos

- Python 3.10 o superior.
- Node.js 18 o superior.
- npm.

## Instalación

### 1. Backend

```bash
cd API
python -m venv venv
venv\Scripts\activate
pip install -r ..\requirements.txt
```

### 2. Frontend

```bash
cd frontend
npm install
```

## Ejecución local

### Backend

Desde la carpeta `API`:

```bash
python app.py
```

El servidor se ejecuta en `http://localhost:5000`.

### Frontend

Desde la carpeta `frontend`:

```bash
npm run dev
```

La aplicación normalmente queda disponible en `http://localhost:5173`.

## API REST

Base URL:

```text
http://localhost:5000/api
```

### Endpoints disponibles

#### `GET /productos`
Obtiene todos los productos registrados.

#### `POST /productos`
Crea un nuevo producto.

Ejemplo de cuerpo:

```json
{
	"nombre": "Teclado",
	"stock": 10
}
```

#### `PUT /productos/{id}`
Actualiza un producto existente.

Ejemplo de cuerpo:

```json
{
	"nombre": "Teclado mecánico",
	"stock": 12
}
```

#### `DELETE /productos/{id}`
Elimina un producto del inventario.

## Persistencia de datos

La aplicación usa SQLite como base de datos local. El archivo `database.db` se crea en la carpeta `API` cuando el backend se ejecuta por primera vez.

## Notas del proyecto

- El frontend consume la API en `http://localhost:5000/api`.
- La interfaz permite aumentar o disminuir el stock de forma directa desde cada producto.
- El backend bloquea valores negativos para mantener la consistencia del inventario.

## Posibles mejoras futuras

- Historial de movimientos de inventario.
- Autenticación de usuarios.
- Filtros y búsqueda de productos.
- Pruebas automatizadas para backend y frontend.

## Licencia

Proyecto académico sin licencia comercial definida.