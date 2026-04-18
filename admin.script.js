// --- CONFIGURACIÓN ---
const ADMIN_PASSWORD = '21851963'; // <-- ¡CONTRASEÑA!
// -------------------

let llantas = [];
let originalLlantasState = '';

const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const productListContainer = document.getElementById('product-list-admin');

// Modal y Formulario
const modal = document.getElementById('product-modal-admin');
const form = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const formMode = document.getElementById('form-mode');
const closeModalBtn = document.getElementById('modal-close-admin');
const addProductBtn = document.getElementById('add-product-btn');
const exportBtn = document.getElementById('export-json-btn');


// --- AUTENTICACIÓN ---
loginButton.addEventListener('click', () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        loadProducts();
    } else {
        alert('Contraseña incorrecta.');
    }
});

passwordInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

// --- CARGA Y RENDERIZADO DE PRODUCTOS ---
async function loadProducts() {
    try {
        const response = await fetch('data.json');
        llantas = await response.json();
        originalLlantasState = JSON.stringify(llantas); // Guardar estado original
        renderProductList();
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        productListContainer.innerHTML = '<p>No se pudieron cargar los productos.</p>';
    }
}

function renderProductList() {
    if (llantas.length === 0) {
        productListContainer.innerHTML = '<p>No hay productos en el catálogo.</p>';
        return;
    }

    productListContainer.innerHTML = llantas.map((llanta, index) => `
        <div class="product-item-admin" data-index="${index}">
            <img src="${llanta.imagen}.jpg" alt="${llanta.codigo}" onerror="this.src='img/LOGO.png'">
            <div class="info">
                <h4>${llanta.marca} - ${llanta.codigo}</h4>
                <p>${llanta.color} | $${llanta.precio.toLocaleString('es-CL')}</p>
            </div>
            <div class="actions">
                <button class="btn-admin btn-edit" onclick="openEditModal(${index})">Editar</button>
                <button class="btn-admin btn-delete" onclick="deleteProduct(${index})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

// --- GESTIÓN DE PRODUCTOS (CRUD) ---

function deleteProduct(index) {
    if (confirm(`¿Estás seguro de que quieres eliminar el producto ${llantas[index].codigo}?`)) {
        llantas.splice(index, 1);
        renderProductList();
    }
}

function openAddModal() {
    form.reset();
    formTitle.textContent = 'Añadir Nuevo Producto';
    formMode.value = 'add';
    modal.classList.add('open');
}

function openEditModal(index) {
    const llanta = llantas[index];
    formTitle.textContent = `Editando: ${llanta.codigo}`;
    formMode.value = index; // Usamos el índice para saber cuál editar

    // Llenar el formulario
    document.getElementById('marca').value = llanta.marca || '';
    document.getElementById('codigo').value = llanta.codigo || '';
    document.getElementById('aro').value = Array.isArray(llanta.aro) ? llanta.aro.join(',') : '';
    document.getElementById('medida').value = llanta.medida || '';
    document.getElementById('apernadura').value = Array.isArray(llanta.apernadura) ? llanta.apernadura.join(',') : '';
    document.getElementById('color').value = llanta.color || '';
    document.getElementById('precio').value = llanta.precio || '';
    document.getElementById('imagen').value = llanta.imagen || '';
    document.getElementById('descripcion').value = llanta.descripcion || '';

    modal.classList.add('open');
}

function closeModal() {
    modal.classList.remove('open');
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newLlanta = {
        marca: document.getElementById('marca').value,
        codigo: document.getElementById('codigo').value,
        aro: document.getElementById('aro').value.split(',').map(a => parseInt(a.trim())).filter(a => !isNaN(a)),
        medida: document.getElementById('medida').value,
        apernadura: document.getElementById('apernadura').value.split(',').map(a => a.trim()),
        color: document.getElementById('color').value,
        precio: parseInt(document.getElementById('precio').value),
        imagen: document.getElementById('imagen').value,
        descripcion: document.getElementById('descripcion').value,
    };

    const mode = formMode.value;
    if (mode === 'add') {
        llantas.push(newLlanta);
    } else {
        // Es un índice para editar
        llantas[parseInt(mode)] = newLlanta;
    }

    renderProductList();
    closeModal();
});


// --- EXPORTACIÓN ---

function exportJson() {
    if (confirm('Esto generará un archivo "data.json" para que lo descargues. ¿Continuar?')) {
        const jsonString = JSON.stringify(llantas, null, 2); // El '2' es para que el JSON se vea ordenado
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('El archivo "data.json" se ha descargado. \n\nAhora debes subirlo a tu servidor para reemplazar el archivo antiguo y que los cambios se hagan efectivos.');
    }
}

// --- EVENT LISTENERS ---

addProductBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});
exportBtn.addEventListener('click', exportJson);

// Advertir al usuario si intenta salir con cambios sin guardar
window.addEventListener('beforeunload', (e) => {
    const currentState = JSON.stringify(llantas);
    if (currentState !== originalLlantasState) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
    }
});