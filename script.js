// 1. Variables Globales y Selección de Elementos
let llantas = [];
const grid = document.getElementById('catalogo-grid');

// Selects Móvil (Drawer)
const selectMarca = document.getElementById('f-marca');
const selectAro = document.getElementById('f-aro');
const selectAper = document.getElementById('f-aper');

// Selects Desktop
const selectMarcaDesktop = document.getElementById('f-marca-desktop');
const selectAroDesktop = document.getElementById('f-aro-desktop');
const selectAperDesktop = document.getElementById('f-aper-desktop');

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const selects = [selectMarca, selectAro, selectAper, selectMarcaDesktop, selectAroDesktop, selectAperDesktop];

// 2. Tema Claro/Oscuro
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isLight = savedTheme === 'light';
    if (isLight) document.body.classList.add('light-mode');
    themeIcon.textContent = isLight ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const light = document.body.classList.toggle('light-mode');
        themeIcon.textContent = light ? '☀️' : '🌙';
        localStorage.setItem('theme', light ? 'light' : 'dark');
    });
}

// 3. Cargar Datos
async function cargarDatos() {
    try {
        llantas = await fetch('data.json').then(r => r.json());
        generarFiltrosDinamicos();
        renderizarLlantas(llantas);
    } catch (error) {
        console.error("Error al cargar data.json:", error);
        grid.innerHTML = '<p class="loading">Error al cargar el catálogo</p>';
    }
}

// 4. Generar Filtros Dinámicos
function generarFiltrosDinamicos() {
    const marcas = [...new Set(llantas.map(l => l.marca))].sort();
    const aros = [...new Set(llantas.map(l => l.aro))].sort((a, b) => a - b);
    const apernaduras = [...new Set(llantas.flatMap(l => l.apernadura))].sort();

    // Configuración para móvil
    const configsMobile = [
        [selectMarca, marcas, ''],
        [selectAro, aros, 'Aro '],
        [selectAper, apernaduras, '']
    ];

    // Configuración para desktop
    const configsDesktop = [
        [selectMarcaDesktop, marcas, ''],
        [selectAroDesktop, aros, 'Aro '],
        [selectAperDesktop, apernaduras, '']
    ];

    // Llenar ambos conjuntos de selects
    [...configsMobile, ...configsDesktop].forEach(([select, datos, prefix]) => {
        datos.forEach(valor => {
            const opt = document.createElement('option');
            opt.value = valor;
            opt.textContent = prefix + valor;
            select.appendChild(opt);
        });
    });

    // Sincronizar valores iniciales
    syncSelects('todos', 'todos', 'todos');
}

// 5. Helper para formato de apernadura
function formatApernadura(aper) {
    return Array.isArray(aper) ? aper.join(', ') : aper;
}

// 6. Renderizar Llantas
function renderizarLlantas(lista) {
    if (lista.length === 0) {
        grid.innerHTML = '<p class="loading">No hay modelos con esos filtros.</p>';
        return;
    }

    grid.innerHTML = lista.map(llanta => {
        const aper = formatApernadura(llanta.apernadura);
        const msg = encodeURIComponent(`Hola! Me interesa ${llanta.marca} ${llanta.modelo} (Aro ${llanta.aro}, ${aper})`);
        return `
            <div class="card">
                <img src="${llanta.imagen}" alt="${llanta.modelo}" loading="lazy">
                <div class="card-info">
                    <span class="tag">Aro ${llanta.aro}</span>
                    <h3>${llanta.marca} ${llanta.modelo}</h3>
                    <p class="specs">${aper}</p>
                    <span class="price">$${llanta.precio.toLocaleString('es-CL')}</span>
                    <a href="https://wa.me/56995127303?text=${msg}" target="_blank" class="btn-wsp-item">
                        Consultar Stock
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// 7. Sincronizar Selects (Móvil y Desktop)
function syncSelects(sourceMarca, sourceAro, sourceAper) {
    // Sincronizar valores entre móvil y desktop
    selectMarca.value = sourceMarca;
    selectAro.value = sourceAro;
    selectAper.value = sourceAper;
    selectMarcaDesktop.value = sourceMarca;
    selectAroDesktop.value = sourceAro;
    selectAperDesktop.value = sourceAper;
}

// 8. Filtrar Stock
function filtrarStock() {
    const [m, a, ap] = [selectMarca.value, selectAro.value, selectAper.value];
    syncSelects(m, a, ap);
    
    const filtrados = llantas.filter(l =>
        (m === 'todos' || l.marca === m) &&
        (a === 'todos' || l.aro.toString() === a) &&
        (ap === 'todos' || l.apernadura.includes(ap))
    );
    renderizarLlantas(filtrados);
}

// Función alternativa para filtrar desde selects desktop
function filtrarStockDesktop() {
    const [m, a, ap] = [selectMarcaDesktop.value, selectAroDesktop.value, selectAperDesktop.value];
    syncSelects(m, a, ap);
    
    const filtrados = llantas.filter(l =>
        (m === 'todos' || l.marca === m) &&
        (a === 'todos' || l.aro.toString() === a) &&
        (ap === 'todos' || l.apernadura.includes(ap))
    );
    renderizarLlantas(filtrados);
}

// 8. Drawer Menu Management
function initDrawerMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const drawerMenu = document.getElementById('drawer-menu');
    const closeBtn = document.getElementById('drawer-close');

    if (!menuToggle || !drawerMenu) return;

    // Toggle drawer con botón hamburguesa
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        drawerMenu.classList.toggle('open');
    });

    // Cerrar drawer con botón X
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            drawerMenu.classList.remove('open');
        });
    }

    // Cerrar drawer al hacer click en un select (después de cambiar filtro)
    const drawerSelects = drawerMenu.querySelectorAll('select');
    drawerSelects.forEach(select => {
        select.addEventListener('change', () => {
            // Cerrar drawer con pequeño delay para que se aplique el filtro
            setTimeout(() => {
                drawerMenu.classList.remove('open');
            }, 150);
        });
    });

    // Cerrar drawer al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!drawerMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            drawerMenu.classList.remove('open');
        }
    });

    // Cerrar drawer al presionar Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawerMenu.classList.contains('open')) {
            drawerMenu.classList.remove('open');
        }
    });
}

// 11. Event Listeners
// Listeners para selects móvil
[selectMarca, selectAro, selectAper].forEach(select => {
    select.addEventListener('change', filtrarStock);
});

// Listeners para selects desktop
[selectMarcaDesktop, selectAroDesktop, selectAperDesktop].forEach(select => {
    select.addEventListener('change', filtrarStockDesktop);
});

// Iniciar App
initTheme();
initDrawerMenu();
cargarDatos();