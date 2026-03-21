// 1. Variables Globales y Selección de Elementos
let llantas = []; // Aquí guardaremos los datos del JSON
const grid = document.getElementById('catalogo-grid');
const selectMarca = document.getElementById('f-marca');
const selectAro = document.getElementById('f-aro');
const selectAper = document.getElementById('f-aper');

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// 2. Lógica del Modo Claro / Oscuro
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeIcon.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// 3. Cargar Datos desde el JSON
async function cargarDatos() {
    try {
        const response = await fetch('data.json');
        llantas = await response.json();
        
        // Al cargar, inicializamos los filtros y mostramos todo el stock
        generarFiltrosDinamicos();
        renderizarLlantas(llantas);
    } catch (error) {
        console.error("Error al cargar el JSON:", error);
        grid.innerHTML = '<p class="loading">Error al cargar el catálogo. Revisa el archivo data.json</p>';
    }
}

// 4. Generar opciones de filtros automáticamente
function generarFiltrosDinamicos() {
    // Usamos Set para obtener valores únicos de nuestro JSON
    const marcas = [...new Set(llantas.map(l => l.marca))].sort();
    const aros = [...new Set(llantas.map(l => l.aro))].sort((a,b) => a - b);
    const apernaduras = [...new Set(llantas.map(l => l.apernadura))].sort();

    // Función auxiliar para llenar los <select>
    const llenar = (select, datos, prefijo = "") => {
        datos.forEach(valor => {
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = `${prefijo}${valor}`;
            select.appendChild(option);
        });
    };

    llenar(selectMarca, marcas);
    llenar(selectAro, aros, "Aro ");
    llenar(selectAper, apernaduras);
}

// 5. Dibujar las tarjetas (Cards) en el HTML
function renderizarLlantas(lista) {
    grid.innerHTML = ''; // Limpiar el grid antes de mostrar

    if (lista.length === 0) {
        grid.innerHTML = '<p class="loading">No hay modelos con esos filtros.</p>';
        return;
    }

    lista.forEach(llanta => {
        // Crear mensaje de WhatsApp específico para este modelo
        const mensaje = encodeURIComponent(`Hola Neumasur! Me interesa el modelo ${llanta.marca} ${llanta.modelo} (Aro ${llanta.aro}, ${llanta.apernadura})`);
        const urlWsp = `https://wa.me/56995127303?text=${mensaje}`;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${llanta.imagen}" alt="${llanta.modelo}" loading="lazy">
            <div class="card-info">
                <span class="tag">Aro ${llanta.aro}</span>
                <h3>${llanta.marca} ${llanta.modelo}</h3>
                <p class="specs">${llanta.apernadura}</p>
                <span class="price">$${llanta.precio.toLocaleString('es-CL')}</span>
                <a href="${urlWsp}" target="_blank" class="btn-wsp-item">
                    Consultar Stock
                </a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 6. Filtrar Stock
function filtrarStock() {
    const m = selectMarca.value;
    const a = selectAro.value;
    const ap = selectAper.value;

    const filtrados = llantas.filter(l => {
        const matchMarca = m === 'todos' || l.marca === m;
        const matchAro = a === 'todos' || l.aro.toString() === a;
        const matchAper = ap === 'todos' || l.apernadura === ap;
        return matchMarca && matchAro && matchAper;
    });

    renderizarLlantas(filtrados);
}

// 7. Event Listeners para los filtros
selectMarca.addEventListener('change', filtrarStock);
selectAro.addEventListener('change', filtrarStock);
selectAper.addEventListener('change', filtrarStock);

// Iniciar aplicación
initTheme();
cargarDatos();