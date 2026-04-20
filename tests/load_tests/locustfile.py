from locust import HttpUser, task, between

class InventoryAPIUser(HttpUser):
    # Simula una espera de entre 1 y 3 segundos entre cada tarea (simulando que el usuario lee la pantalla)
    wait_time = between(1, 3) 
    
    def on_start(self):
        # Esta función se ejecuta para cada usuario simulado al iniciar
        # Ideal para hacer login y conseguir el token
        
        # Primero, hacemos la llamada al login (recuerda que el backend debe tener estos usuarios por defecto)
        response = self.client.post("/api/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        # Si el login es exitoso guardamos el token
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            # Configurar un header base para todas las futuras peticiones de este HttpUser
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            print(f"Error al iniciar sesión durante el test de carga: {response.text}")
            self.token = None

    @task(3) # Mayor peso, significa que se ejecuta más veces que otras tareas (proporción de llamadas)
    def test_get_empresas(self):
        """Prueba de carga consultando todas las empresas"""
        if self.token:
            self.client.get("/api/empresas")

    @task(3)
    def test_get_impresoras(self):
        """Prueba de carga consultando lista de impresoras"""
        if self.token:
            self.client.get("/api/impresoras")

    @task(1) # Menor peso, menos frecuente
    def test_get_impresoras_stats(self):
        """Prueba solicitando las estadísticas, que agrupa y suma en DB (más pesado)"""
        if self.token:
            self.client.get("/api/impresoras/stats")

    @task(1)
    def test_get_modelos(self):
        """Prueba obteniendo la lista de modelos"""
        if self.token:
            self.client.get("/api/impresoras/modelos")
