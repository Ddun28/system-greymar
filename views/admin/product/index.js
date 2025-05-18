let productModal = document.getElementById('productModal');
let currentProductAction = 'create';

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategories(); // Para el select de categorías
});

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        showAlert('Error al cargar productos', 'danger');
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        const select = document.getElementById('productCategory');
        select.innerHTML = categories.map(cat => 
            `<option value="${cat.id}">${cat.nombre}</option>`
        ).join('');
    } catch (error) {
        showAlert('Error al cargar categorías', 'danger');
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('products-list');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = `
            <tr>
                <td class="px-6 py-4">${product.nombre}</td>
                <td class="px-6 py-4">${product.categoria_nombre}</td>
                <td class="px-6 py-4">${product.stock}</td>
                <td class="px-6 py-4">
                    <button class="btn btn-sm btn-warning" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Resto de funciones CRUD similares a usuarios pero manejando imágenes