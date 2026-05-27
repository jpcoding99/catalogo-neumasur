// 1. Variables Globales y Selección de Elementos
let neumaticos = [];
let llantas = [];
let activeCatalog = 'neumaticos'; // 'neumaticos' o 'llantas'
let lazyLoadObserver;

const grid = document.getElementById('catalogo-grid');
const searchInput = document.getElementById('search-input');
const modal = document.getElementById('product-modal');
const catalogTitle = document.getElementById('catalog-title');
const catalogSubtitle = document.getElementById('catalog-subtitle');

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

// Grupos de filtros para mostrar/ocultar
const apernaduraGroupMobile = document.getElementById('f-aper-group-mobile');
const apernaduraGroupDesktop = document.getElementById('f-aper-group-desktop');

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
        const data = await fetch('data.json').then(r => r.json());
        neumaticos = data.neumaticos;
        llantas = data.llantas;
        
        updateFiltersForCatalog(); // Genera filtros para el catálogo por defecto
        filtrarYRenderizar(); // Renderiza el catálogo inicial
    } catch (error) {
        console.error("Error al cargar datos del catálogo:", error);
        grid.innerHTML = '<p class="loading">Error al cargar el catálogo. Por favor, inténtalo de nuevo más tarde.</p>';
    }
}

// 4. Generar Filtros Dinámicos
function generarFiltrosDinamicos() {
    const marcas = [...new Set(modelos.map(m => m.marca))].sort();
    // Obtenemos todos los aros de todas las medidas de todos los modelos
    const aros = [...new Set(modelos.flatMap(m => m.medidas.map(med => med.aro)))].sort((a, b) => a - b);

    // Configuración para móvil
    const configsMobile = [
        [selectMarca, marcas, ''],
        [selectAro, aros, 'Aro ']
    ];

    // Configuración para desktop
    const configsDesktop = [
        [selectMarcaDesktop, marcas, ''],
        [selectAroDesktop, aros, 'Aro ']
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
    syncSelects('todos', 'todos', 'default');
}

// 5.5 Helper para generar mensaje de WhatsApp
function generarMensajeWsp(modelo, medida) {
    if (!modelo || !medida) return '';
    const texto = `Hola! Me interesa el neumático ${modelo.marca} ${modelo.modelo}, medida ${medida.medida_str}.`;
    return encodeURIComponent(texto);
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

function renderizarNeumaticos(lista) {
    if (lista.length === 0) {
        grid.innerHTML = '<p class="loading">No hay modelos con esos filtros.</p>';
        return;
    }

    grid.innerHTML = lista.map(llanta => {
        const medidasDisponibles = llanta.medidas.filter(m => !m.agotado).length;
        const minPrice = Math.min(...llanta.medidas.filter(m => !m.agotado).map(m => m.precio));

        const cardClass = medidasDisponibles > 0 ? 'card' : 'card sold-out';
        const buttonHTML = `<button class="btn-wsp-item" ${medidasDisponibles === 0 ? 'disabled' : ''}>
            ${medidasDisponibles > 0 ? 'Ver Detalles' : 'Agotado'}
        </button>`;

        return `
            <div class="${cardClass}" data-codigo-base="${llanta.codigo_base}">
                <img data-src="${llanta.imagen_base}.jpg" alt="Neumático ${llanta.marca} ${llanta.modelo}" class="lazy-img" loading="lazy">
                <div class="card-info">
                    <span class="tag">${llanta.marca}</span>
                    <h3>${llanta.modelo}</h3>
                    <p class="color-text">${medidasDisponibles} medida(s) disponible(s)</p>
                    ${minPrice !== Infinity ? `<span class="price">Desde $${minPrice.toLocaleString('es-CL')}</span>` : '<span class="price">No disponible</span>'}
                    ${buttonHTML}
                </div>
            </div>
        `;
    }).join('');

    const newImages = grid.querySelectorAll('.lazy-img');
    newImages.forEach(img => lazyLoadObserver.observe(img));
}

// 7. Sincronizar Selects (Móvil y Desktop)
function syncSelects(marca, aro, sort) {
    // Sincronizar valores entre móvil y desktop
    selectMarca.value = marca;
    selectAro.value = aro;
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
    const sort = selectSort.value; // ordenamiento
    const searchTerm = searchInput.value.toLowerCase().trim();

    let filtrados = modelos.filter(modelo => {
        // Condición de los selects
        const matchesMarca = (m === 'todos' || modelo.marca === m);
        // El modelo debe tener al menos una medida que coincida con el aro seleccionado
        const matchesAro = (a === 'todos' || modelo.medidas.some(med => med.aro === parseInt(a)));

        // Condición de la búsqueda
        const matchesSearch = searchTerm === '' ||
                              modelo.modelo.toLowerCase().includes(searchTerm) ||
                              modelo.marca.toLowerCase().includes(searchTerm) ||
                              (modelo.descripcion && modelo.descripcion.toLowerCase().includes(searchTerm));

        return matchesMarca && matchesAro && matchesSearch;
    });

    // Aplicar ordenamiento
    if (sort === 'price-asc') {
        filtrados.sort((x, y) => {
            const minPriceX = Math.min(...x.medidas.filter(med => !med.agotado).map(med => med.precio), Infinity);
            const minPriceY = Math.min(...y.medidas.filter(med => !med.agotado).map(med => med.precio), Infinity);
            return minPriceX - minPriceY;
        });
    } else if (sort === 'price-desc') {
        filtrados.sort((x, y) => {
            const minPriceX = Math.min(...x.medidas.filter(med => !med.agotado).map(med => med.precio), Infinity);
            const minPriceY = Math.min(...y.medidas.filter(med => !med.agotado).map(med => med.precio), Infinity);
            return minPriceY - minPriceX;
        });
    }

    renderizarModelos(filtrados);
    actualizarURL(); // Actualiza la URL con los filtros actuales
}

// Actualiza la URL con los parámetros de filtro actuales
function actualizarURL() {
    const params = new URLSearchParams();
    const m = selectMarca.value;
    const a = selectAro.value;
    const sort = selectSort.value;
    const searchTerm = searchInput.value.trim();

    if (m !== 'todos') params.set('marca', m);
    if (a !== 'todos') params.set('aro', a);
    if (sort !== 'default') params.set('sort', sort);
    if (searchTerm !== '') params.set('q', searchTerm);

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    history.replaceState({path: newUrl}, '', newUrl);
}

// Función que se activa con el evento 'change' para sincronizar y luego filtrar
function handleFilterChange(event) {
    const source = event.target.id.includes('-desktop') ? 'desktop' : 'mobile';
    const [m, a, ap, s] = source === 'desktop' 
        ? [selectMarcaDesktop.value, selectAroDesktop.value, null, selectSortDesktop.value]
        : [selectMarca.value, selectAro.value, null, selectSort.value];
    
    syncSelects(m, a, s);
    filtrarYRenderizar();
}

// Lee los parámetros de la URL al cargar la página y aplica los filtros
function aplicarFiltrosDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const marca = params.get('marca') || 'todos';
    const aro = params.get('aro') || 'todos';
    const sort = params.get('sort') || 'default';
    const q = params.get('q') || '';

    searchInput.value = q;
    syncSelects(marca, aro, sort);
    filtrarYRenderizar();
}

// 9. Lazy Loading, Debounce y Utilidades

// Función Debounce para no sobrecargar el filtro de búsqueda
function debounce(func, delay = 250) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
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

// Función Debounce para no sobrecargar el filtro de búsqueda
function debounce(func, delay = 250) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
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

    function openModal(codigoBase) {
        const modelo = modelos.find(m => m.codigo_base === codigoBase);
        if (!modelo) return;

        const descripcionHTML = modelo.descripcion 
            ? `<p class="modal-description">${modelo.descripcion}</p>` 
            : '';

        // 1. Inyectar la estructura del modal
        modalBody.innerHTML = `
            <div class="card modal-card">
                <img src="${modelo.imagen_base}.jpg" alt="Neumático ${modelo.marca} ${modelo.modelo}">
                <div class="card-info">
                    <span class="tag">${modelo.marca}</span>
                    <h3>${modelo.modelo}</h3>
                    ${descripcionHTML}
                    <div class="modal-dynamic-section">
                        <div class="filter-group">
                            <label for="modal-size-select">Selecciona la medida:</label>
                            <select id="modal-size-select"></select>
                        </div>
                        <span id="modal-price-display" class="price"></span>
                        <a id="modal-wsp-button" target="_blank" class="btn-wsp-item">Consultar Stock</a>
                    </div>
                </div>
            </div>`;

        // 2. Poblar y manejar la sección dinámica
        const sizeSelect = document.getElementById('modal-size-select');
        const priceDisplay = document.getElementById('modal-price-display');
        const wspButton = document.getElementById('modal-wsp-button');

        modelo.medidas.forEach(medida => {
            const option = document.createElement('option');
            option.value = medida.id;
            option.textContent = `${medida.medida_str} ${medida.agotado ? '(Agotado)' : ''}`;
            option.disabled = medida.agotado;
            sizeSelect.appendChild(option);
        });

        function actualizarModal(medidaId) {
            const medidaSeleccionada = modelo.medidas.find(m => m.id === medidaId);
            if (!medidaSeleccionada) return;

            priceDisplay.textContent = `$${medidaSeleccionada.precio.toLocaleString('es-CL')}`;
            
            if (medidaSeleccionada.agotado) {
                wspButton.classList.add('disabled');
                wspButton.removeAttribute('href');
                wspButton.textContent = 'Agotado';
            } else {
                const msg = generarMensajeWsp(modelo, medidaSeleccionada);
                wspButton.classList.remove('disabled');
                wspButton.href = `https://wa.me/56977967174?text=${msg}`;
                wspButton.textContent = 'Consultar Stock';
            }
        }

        sizeSelect.addEventListener('change', (e) => actualizarModal(e.target.value));
        
        // 3. Estado inicial y abrir modal
        actualizarModal(sizeSelect.value); // Llama con la primera medida seleccionada
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
        // Solo abrir si no se hizo clic en un enlace dentro de la tarjeta
        if (card && card.dataset.codigoBase && e.target.tagName !== 'A') {
            openModal(card.dataset.codigoBase);
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
        syncSelects('todos', 'todos', 'default');

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
searchInput.addEventListener('input', debounce(filtrarYRenderizar));

// Iniciar App
initTheme();
setupLazyLoader();
initDrawerMenu();
initBackToTopButton();
initModal();
initLogoAction();
cargarDatos();