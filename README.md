# Catálogo de Llantas Neumasur

Este proyecto es un catálogo de productos web dinámico, diseñado para ser rápido, eficiente y fácil de administrar. Cuenta con un panel de administración para la gestión de productos y está construido sobre una arquitectura Jamstack moderna utilizando Netlify y MongoDB.

## Características Principales

- **Catálogo de Productos Dinámico:** Muestra productos desde una base de datos MongoDB.
- **Generación de Datos en el Build:** Para un rendimiento óptimo y ahorro de costos, los datos del catálogo público se generan como un archivo estático (`data.json`) durante el despliegue.
- **Filtrado y Búsqueda en el Cliente:** Permite a los usuarios filtrar y buscar productos por marca, aro, apernadura y término de búsqueda de forma instantánea.
- **Panel de Administración Protegido:** Una sección `/admin.html` permite la gestión completa de productos (Añadir, Editar, Eliminar).
- **Subida de Imágenes a Cloudinary:** El panel de administración integra la subida de imágenes directamente a Cloudinary, optimizando la entrega y gestión de archivos multimedia.
- **Estado de "Agotado":** Permite marcar productos como agotados, cambiando su apariencia y deshabilitando la opción de consulta en el catálogo público.
- **Tema Claro/Oscuro/Automático:** El sitio respeta la preferencia de tema del sistema operativo del usuario y permite la selección manual.
- **Diseño Responsivo:** Adaptado para una correcta visualización en dispositivos móviles, tablets y de escritorio.
- **Lazy Loading:** Las imágenes de los productos se cargan de forma diferida para mejorar el tiempo de carga inicial.

## Stack Tecnológico

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla).
- **Base de Datos:** MongoDB Atlas.
- **Plataforma de Despliegue y Backend:** Netlify (Sitio estático, Funciones Serverless).
- **Gestión de Imágenes:** Cloudinary.(aun no incorporado)
- **Entorno de Ejecución:** Node.js (para el script de build y las funciones serverless).

## Estructura del Proyecto

```
catalogo-neumasur/
├── admin.html              # Panel de administración
├── admin.script.js         # Lógica del panel de administración
├── admin.css               # Estilos del panel de administración
├── index.html              # Catálogo público
├── script.js               # Lógica del catálogo público
├── style.css               # Estilos principales
├── build-data.js           # Script que se ejecuta en el build para generar data.json
├── data.json               # Archivo estático con los datos de productos (generado)
├── netlify/
│   └── functions/
│       ├── get-products.js       # Función para obtener productos (usada por el admin)
│       ├── update-products.js    # Función para guardar cambios en la BD
│       └── generate-signature.js # Función para firmar subidas a Cloudinary
├── package.json            # Dependencias del proyecto
└── README.md               # Esta documentación
```

## Configuración y Desarrollo Local

Para ejecutar el proyecto en tu máquina local, necesitarás Node.js y npm instalados.

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/catalogo-neumasur.git
cd catalogo-neumasur
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo llamado `.env` en la raíz del proyecto y añade las siguientes variables. Estas son necesarias para que las funciones serverless y el script de build se conecten a los servicios externos.

```env
# MongoDB
MONGO_URI="mongodb+srv://..."

# Clave para proteger las funciones de administración
ADMIN_SECRET_KEY="una_clave_secreta_muy_larga_y_aleatoria"

# Cloudinary
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
```

### 4. Ejecutar el Servidor de Desarrollo

La mejor manera de probar todo el proyecto (frontend y funciones backend) es usando el Netlify CLI.

```bash
# Instalar Netlify CLI (si no lo tienes)
npm install -g netlify-cli

# Iniciar sesión
netlify login

# Vincular con tu sitio en Netlify
netlify link

# Iniciar el servidor de desarrollo
netlify dev
```

Esto levantará un servidor local (generalmente en `http://localhost:8888`) que emula el entorno de Netlify, permitiendo que tus funciones serverless se ejecuten correctamente.

### Alternativa: Probar solo el Catálogo Público

Si solo quieres ver el catálogo estático, primero debes generar el archivo `data.json`.

```bash
# Ejecuta el script de build una vez
node build-data.js
```

Luego, puedes usar una extensión como "Live Server" en VS Code para abrir `index.html`.

## Despliegue

El sitio está configurado para desplegarse automáticamente en Netlify cada vez que se hace un `push` a la rama principal.

1.  **Comando de Build:** En la configuración de Netlify, el "Build command" debe ser `node build-data.js`. Esto asegura que el `data.json` se actualice con los datos más recientes de la base de datos en cada despliegue.
2.  **Variables de Entorno:** Las mismas variables del archivo `.env` deben ser configuradas en la interfaz de Netlify en **Site configuration > Build & deploy > Environment**.

## Flujo de Trabajo para Actualizar Productos

Debido a la arquitectura de generación de sitio estático, el proceso para actualizar el catálogo público consta de dos pasos:

1.  **Guardar en la Base de Datos:**
    - Accede a `/admin.html` e introduce la contraseña.
    - Realiza los cambios necesarios (añadir, editar, eliminar productos, cambiar imágenes, marcar como agotado).
    - Haz clic en el botón **"Guardar Cambios en la Base de Datos"**. Esto actualizará la información en MongoDB, pero **no será visible en el sitio público todavía**.

2.  **Redesplegar el Sitio:**
    - Ve a tu panel de control en Netlify.
    - Navega a la pestaña **"Deploys"**.
    - Haz clic en el menú **"Trigger deploy"** y selecciona **"Deploy site"**.

Este nuevo despliegue ejecutará el script `build-data.js`, que leerá los datos actualizados de MongoDB y generará un nuevo `data.json`, haciendo los cambios visibles para todos los usuarios.

---

