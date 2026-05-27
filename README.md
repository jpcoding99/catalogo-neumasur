# Catálogo de Llantas Neumasur (Versión Estática)

Este proyecto es la versión estática y simplificada de un catálogo de productos. Fue migrado desde una arquitectura dinámica (que usaba Netlify Functions y MongoDB) para lograr un sitio más rápido, ligero y con un mantenimiento más sencillo.

Ahora, se despliega automáticamente en GitHub Pages.

## Características Principales

- **Catálogo 100% Estático:** Todos los datos de los productos se leen desde el archivo `data.json`, lo que garantiza la máxima velocidad de carga.
- **Filtrado y Búsqueda en el Cliente:** Permite a los usuarios filtrar y buscar productos por marca, aro, apernadura y término de búsqueda de forma instantánea.
- **Estado de "Agotado":** Permite marcar productos como agotados, cambiando su apariencia y deshabilitando la opción de consulta en el catálogo público.
- **Tema Claro/Oscuro/Automático:** El sitio respeta la preferencia de tema del sistema operativo del usuario y permite la selección manual.
- **Diseño Responsivo:** Adaptado para una correcta visualización en dispositivos móviles, tablets y de escritorio.
- **Lazy Loading:** Las imágenes de los productos se cargan de forma diferida para mejorar el tiempo de carga inicial.

## Stack Tecnológico

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla).
- **Plataforma de Despliegue:** GitHub Pages con GitHub Actions.

## Despliegue

El sitio está configurado para desplegarse automáticamente en GitHub Pages cada vez que se hace un `push` a la rama `main`. El workflow se encuentra en `.github/workflows/deploy-pages.yml`.

## Flujo de Trabajo para Actualizar Productos

El proceso para actualizar el catálogo es ahora 100% manual, eliminando la necesidad de una base de datos. Se edita directamente el archivo `data.json`.

1.  **Editar los Datos:**
    - Abre el archivo `data.json` en tu editor de código.
    - Realiza los cambios necesarios: puedes añadir un nuevo objeto de producto, editar uno existente o eliminarlo. Asegúrate de mantener la sintaxis JSON correcta.

2.  **Subir los Cambios:**
    - Guarda el archivo `data.json`.
    - Sube tus cambios a GitHub usando los comandos de Git:
    ```bash
    git add data.json
    git commit -m "Actualiza productos del catálogo"
    git push origin main
    ```

3.  **Despliegue Automático:**
    - Al recibir el `push`, una GitHub Action se activará automáticamente, tomará tus archivos y desplegará la nueva versión del sitio en GitHub Pages. Los cambios estarán visibles en minutos.

---
