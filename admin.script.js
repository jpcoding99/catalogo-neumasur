// --- CONFIGURACIÓN ---
const ADMIN_PASSWORD = '21851963'; // <-- ¡CONTRASEÑA!
const ADMIN_SECRET_KEY = 'kE7bLp9sR2vXzW8qA4nCjF1gH5mP3uT'; // <-- ¡IMPORTANTE! Usa la misma que en Netlify
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
const saveBtn = document.getElementById('export-json-btn'); // Renombrado en HTML a 'save-changes-btn'


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
        const response = await fetch('/.netlify/functions/get-products');
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }
        llantas = await response.json();
        originalLlantasState = JSON.stringify(llantas); // Guardar estado original
        renderProductList();
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        productListContainer.innerHTML = '<p>No se pudieron cargar los productos desde la base de datos.</p>';
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


// --- GUARDAR CAMBIOS EN LA BASE DE DATOS ---

async function saveChangesToDB() {
    if (!confirm('¿Estás seguro de que quieres guardar todos los cambios en la base de datos? Esta acción es irreversible.')) {
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    try {
        const response = await fetch('/.netlify/functions/update-products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': ADMIN_SECRET_KEY 
            },
            body: JSON.stringify(llantas)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || `Error del servidor: ${response.statusText}`);
        }

        originalLlantasState = JSON.stringify(llantas); // Actualizar el estado original
        alert('¡Éxito! Los cambios se han guardado en la base de datos.');

    } catch (error) {
        console.error('Error al guardar los cambios:', error);
        alert(`Error al guardar los cambios: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Cambios en la Base de Datos';
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
saveBtn.addEventListener('click', saveChangesToDB);

// Advertir al usuario si intenta salir con cambios sin guardar
window.addEventListener('beforeunload', (e) => {
    const currentState = JSON.stringify(llantas);
    if (currentState !== originalLlantasState) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
    }
});