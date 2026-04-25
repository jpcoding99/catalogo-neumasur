// 1. Variables Globales y Selección de Elementos
let llantas = [];
let lazyLoadObserver;
const grid = document.getElementById('catalogo-grid');
const searchInput = document.getElementById('search-input');
const modal = document.getElementById('product-modal');

// Selects Móvil (Drawer)
const selectMarca = document.getElementById('f-marca');
const selectAro = document.getElementById('f-aro');
const selectAper = document.getElementById('f-aper');

// Selects Desktop
const selectMarcaDesktop = document.getElementById('f-marca-desktop');
const selectAroDesktop = document.getElementById('f-aro-desktop');
const selectAperDesktop = document.getElementById('f-aper-desktop');

// Selects de Ordenamiento
const selectSort = document.getElementById('f-sort');
const selectSortDesktop = document.getElementById('f-sort-desktop');

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeOptionsContainer = document.getElementById('theme-options');

const selects = [
    selectMarca, selectAro, selectAper, selectSort,
    selectMarcaDesktop, selectAroDesktop, selectAperDesktop, selectSortDesktop
];

// 2. Tema Claro/Oscuro
// 2. Tema Claro/Oscuro (con soporte para preferencia del sistema)
function initTheme() {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const themeOptionButtons = themeOptionsContainer.querySelectorAll('button');

    // Función para aplicar el tema (claro u oscuro) al body
    function applyTheme(theme) {
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        
        // Corregir un bug visual en modo claro donde el fondo no se aplicaba correctamente
        if (isLight) {
            document.body.style.background = 'var(--bg-color)';
        } else {
            document.body.style.background = 'linear-gradient(135deg, var(--bg-color) 0%, #0a0c0e 100%)';
        }
    }

    // Función para actualizar el ícono del botón según la configuración (light, dark, auto)
    function updateIcon(setting) {
        if (setting === 'light') {
            themeIcon.textContent = 'Claro';
        } else if (setting === 'dark') {
            themeIcon.textContent = 'Oscuro';
        } else { // 'auto'
            themeIcon.textContent = 'Automático';
        }
    }

    // Obtiene el tema que se debe mostrar, considerando la configuración 'auto'
    function getEffectiveTheme(setting) {
        if (setting === 'auto') {
            return prefersDarkScheme.matches ? 'dark' : 'light';
        }
        return setting;
    }

    function setSetting(setting) {
        // 1. Guardar en localStorage
        localStorage.setItem('theme', setting);
        // 2. Aplicar el tema visual
        applyTheme(getEffectiveTheme(setting));
        // 3. Actualizar el ícono principal
        updateIcon(setting);
        // 4. Marcar la opción activa en el menú
        themeOptionButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === setting);
        });
    }

    // Carga inicial
    let currentSetting = localStorage.getItem('theme') || 'auto';
    setSetting(currentSetting);

    // Listener para abrir/cerrar el menú de opciones
    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        themeOptionsContainer.classList.toggle('open');
    });

    // Listeners para cada botón de opción
    themeOptionButtons.forEach(button => {
        button.addEventListener('click', () => {
            setSetting(button.dataset.theme);
            themeOptionsContainer.classList.remove('open'); // Cerrar menú
        });
    });

    // Listener para cuando el sistema operativo cambia de tema
    prefersDarkScheme.addEventListener('change', (e) => {
        // Solo actualiza si el usuario tiene la configuración en 'auto'
        if (localStorage.getItem('theme') === 'auto' || !localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!themeToggle.contains(e.target) && !themeOptionsContainer.contains(e.target)) {
            themeOptionsContainer.classList.remove('open');
        }
    });
}

// 3. Cargar Datos
async function cargarDatos() {
    try {
        renderizarSkeletons(8); // Mostrar 8 skeletons mientras carga
        // Ahora cargamos el archivo estático generado en el build
        llantas = await fetch('data.json').then(r => r.json());
        generarFiltrosDinamicos();
        aplicarFiltrosDesdeURL(); // Aplica filtros de la URL al cargar
    } catch (error) {
        console.error("Error al cargar datos del catálogo:", error);
        grid.innerHTML = '<p class="loading">Error al cargar el catálogo. Por favor, inténtalo de nuevo más tarde.</p>';
    }
}

// 4. Generar Filtros Dinámicos
function generarFiltrosDinamicos() {
    const marcas = [...new Set(llantas.map(l => l.marca))].sort();
    const aros = [...new Set(llantas.flatMap(l => l.aro))].sort((a, b) => a - b);
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
    syncSelects('todos', 'todos', 'todos', 'default');
}

// 5. Helper para formato de apernadura
function formatApernadura(aper) {
    return Array.isArray(aper) ? aper.join(', ') : aper;
}

// 6. Renderizar Skeletons y Llantas
function renderizarSkeletons(cantidad) {
    const skeletonHTML = `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-info">
                <div class="skeleton-text" style="width: 40%;"></div>
                <div class="skeleton-text" style="width: 80%; height: 1.5em; margin-top: 15px;"></div>
                <div class="skeleton-text" style="width: 60%;"></div>
                <div class="skeleton-text" style="width: 90%; margin-top: 15px;"></div>
                <div class="skeleton-text" style="width: 50%; height: 2em; margin-top: 20px;"></div>
            </div>
        </div>
    `;
    grid.innerHTML = Array(cantidad).fill(skeletonHTML).join('');
}

function renderizarLlantas(lista) {
    if (lista.length === 0) {
        grid.innerHTML = '<p class="loading">No hay modelos con esos filtros.</p>';
        return;
    }

    grid.innerHTML = lista.map(llanta => {
        const aper = formatApernadura(llanta.apernadura);
        const aroStr = Array.isArray(llanta.aro) ? llanta.aro.join(', ') : llanta.aro;
        const msg = encodeURIComponent(`Hola! Me interesa ${llanta.marca} ${llanta.codigo} - ${llanta.color} (Aro ${aroStr}, ${aper})`);
        
        const isSoldOut = llanta.agotado;
        const cardClass = isSoldOut ? 'card sold-out' : 'card';
        const buttonHTML = isSoldOut
            ? '<button class="btn-wsp-item" disabled>Agotado</button>'
            : `<a href="https://wa.me/56995127303?text=${msg}" target="_blank" class="btn-wsp-item">Consultar Stock</a>`;

        return `
            <div class="${cardClass}" data-codigo="${llanta.codigo}">
                <img data-src="${llanta.imagen}.jpg" alt="${llanta.codigo}" class="lazy-img" loading="lazy">
                <div class="card-info">
                    <span class="tag">${llanta.codigo}</span>
                    <h3>${llanta.codigo}</h3>
                    <p class="color-text">${llanta.color}</p>
                    <p class="specs">
                        <strong>Medida:</strong> ${llanta.medida}<br>
                        <strong>Aro:</strong> ${aroStr} | <strong>Apernadura:</strong> ${aper}
                    </p>
                    <span class="price">$${llanta.precio.toLocaleString('es-CL')}</span>
                    ${buttonHTML}
                </div>
            </div>
        `;
    }).join('');

    // Observar las nuevas imágenes para lazy loading
    const newImages = grid.querySelectorAll('.lazy-img');
    newImages.forEach(img => lazyLoadObserver.observe(img));
}

// 7. Sincronizar Selects (Móvil y Desktop)
function syncSelects(marca, aro, aper, sort) {
    // Sincronizar valores entre móvil y desktop
    selectMarca.value = marca;
    selectAro.value = aro;
    selectAper.value = aper;
    selectSort.value = sort;

    selectMarcaDesktop.value = marca;
    selectAroDesktop.value = aro;
    selectAperDesktop.value = aper;
    selectSortDesktop.value = sort;
}

// 8. Filtrar Stock
function filtrarYRenderizar() {
    // Lee los valores de los filtros y del buscador
    const m = selectMarca.value; // marca
    const a = selectAro.value; // aro
    const ap = selectAper.value; // apernadura
    const sort = selectSort.value; // ordenamiento
    const searchTerm = searchInput.value.toLowerCase().trim();

    let filtrados = llantas.filter(l => {
        // Condición de los selects
        const matchesSelects = (m === 'todos' || l.marca === m) &&
                               (a === 'todos' || l.aro.includes(parseInt(a))) &&
                               (ap === 'todos' || l.apernadura.includes(ap));

        // Condición de la búsqueda
        const matchesSearch = searchTerm === '' ||
                              l.codigo.toLowerCase().includes(searchTerm) ||
                              l.color.toLowerCase().includes(searchTerm) ||
                              (l.descripcion && l.descripcion.toLowerCase().includes(searchTerm));

        return matchesSelects && matchesSearch;
    });

    // Aplicar ordenamiento
    if (sort === 'price-asc') {
        filtrados.sort((x, y) => x.precio - y.precio);
    } else if (sort === 'price-desc') {
        filtrados.sort((x, y) => y.precio - x.precio);
    }

    renderizarLlantas(filtrados);
    actualizarURL(); // Actualiza la URL con los filtros actuales
}

// Actualiza la URL con los parámetros de filtro actuales
function actualizarURL() {
    const params = new URLSearchParams();
    const m = selectMarca.value;
    const a = selectAro.value;
    const ap = selectAper.value;
    const sort = selectSort.value;
    const searchTerm = searchInput.value.trim();

    if (m !== 'todos') params.set('marca', m);
    if (a !== 'todos') params.set('aro', a);
    if (ap !== 'todos') params.set('apernadura', ap);
    if (sort !== 'default') params.set('sort', sort);
    if (searchTerm !== '') params.set('q', searchTerm);

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    history.replaceState({path: newUrl}, '', newUrl);
}

// Función que se activa con el evento 'change' para sincronizar y luego filtrar
function handleFilterChange(event) {
    const source = event.target.id.includes('-desktop') ? 'desktop' : 'mobile';
    const [m, a, ap, s] = source === 'desktop' 
        ? [selectMarcaDesktop.value, selectAroDesktop.value, selectAperDesktop.value, selectSortDesktop.value]
        : [selectMarca.value, selectAro.value, selectAper.value, selectSort.value];
    
    syncSelects(m, a, ap, s);
    filtrarYRenderizar();
}

// Lee los parámetros de la URL al cargar la página y aplica los filtros
function aplicarFiltrosDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const marca = params.get('marca') || 'todos';
    const aro = params.get('aro') || 'todos';
    const apernadura = params.get('apernadura') || 'todos';
    const sort = params.get('sort') || 'default';
    const q = params.get('q') || '';

    searchInput.value = q;
    syncSelects(marca, aro, apernadura, sort);
    filtrarYRenderizar();
}

// 9. Lazy Loading de Imágenes
function setupLazyLoader() {
    const options = {
        rootMargin: '0px 0px 200px 0px' // Empezar a cargar 200px antes de que entre en el viewport
    };

    lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;

                if (!src) return;

                img.src = src;
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });

                observer.unobserve(img);
            }
        });
    }, options);
}

// 10. Drawer Menu Management
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

// 11. Modal de Producto
function initModal() {
    if (!modal) return;

    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close');

    function openModal(codigo) {
        const llanta = llantas.find(l => l.codigo === codigo);
        if (!llanta) return;

        // Reutilizar la lógica de renderizado de la tarjeta
        const aper = formatApernadura(llanta.apernadura);
        const aroStr = Array.isArray(llanta.aro) ? llanta.aro.join(', ') : llanta.aro;
        const msg = encodeURIComponent(`Hola! Me interesa ${llanta.marca} ${llanta.codigo} - ${llanta.color} (Aro ${aroStr}, ${aper})`);
        
        const descripcionHTML = llanta.descripcion 
            ? `<p class="modal-description">${llanta.descripcion}</p>` 
            : '';

        // Inyectar el HTML de la tarjeta dentro del cuerpo del modal
        modalBody.innerHTML = `
            <div class="card">
                <img src="${llanta.imagen}.jpg" alt="${llanta.codigo}">
                <div class="card-info">
                    <span class="tag">${llanta.codigo}</span>
                    <h3>${llanta.codigo}</h3>
                    <p class="color-text">${llanta.color}</p>
                    <p class="specs">
                        <strong>Medida:</strong> ${llanta.medida}<br>
                        <strong>Aro:</strong> ${aroStr} | <strong>Apernadura:</strong> ${aper}
                    </p>
                    ${descripcionHTML}
                    <span class="price">$${llanta.precio.toLocaleString('es-CL')}</span>
                    <a href="https://wa.me/56995127303?text=${msg}" target="_blank" class="btn-wsp-item">
                        Consultar Stock
                    </a>
                </div>
            </div>`;

        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Evita el scroll del fondo
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = ''; // Restaura el scroll
    }

    // Evento para abrir el modal (delegación de eventos)
    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (card && card.dataset.codigo) {
            openModal(card.dataset.codigo);
        }
    });

    // Eventos para cerrar el modal
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => e.target === modal && closeModal());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());
}

// 12. Botón "Volver Arriba"
function initBackToTopButton() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 13. Acción del Logo para Resetear
function initLogoAction() {
    const logoLink = document.getElementById('logo-link');
    if (!logoLink) return;

    logoLink.addEventListener('click', (e) => {
        e.preventDefault();

        // 1. Resetear la barra de búsqueda
        searchInput.value = '';

        // 2. Resetear los filtros a su estado inicial
        syncSelects('todos', 'todos', 'todos', 'default');

        // 3. Volver a renderizar el catálogo completo
        filtrarYRenderizar();

        // 4. Desplazar la vista al inicio de la página
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 14. Event Listeners
// Un solo conjunto de listeners para todos los selects
selects.forEach(select => {
    select.addEventListener('change', handleFilterChange);
});

// Listener para el input de búsqueda
searchInput.addEventListener('input', filtrarYRenderizar);

// Iniciar App
initTheme();
setupLazyLoader();
initDrawerMenu();
initBackToTopButton();
initModal();
initLogoAction();
cargarDatos();