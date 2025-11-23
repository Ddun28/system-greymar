document.addEventListener('DOMContentLoaded', () => {

    const authData = localStorage.getItem('authData');
    if( !authData){
        window.location.href = '/proyecto-3er-trayecto/login';
    }

    const apiBaseUrl = '/proyecto-3er-trayecto/products';
    let currentProductId = null;
    let categories = [];

    // Elementos del DOM
    const elements = {
        modal: document.getElementById('productModal'),
        form: document.getElementById('productForm'),
        list: document.getElementById('products-list'),
        btnNew: document.querySelector('.bg-blue-600'),
        categorySelect: document.getElementById('productCategory'),
        fields: {
            name: document.getElementById('productName'),
            description: document.getElementById('productDescription'),
            stock: document.getElementById('productStock'),
            image: document.getElementById('productImage'),
            modalTitle: document.getElementById('productModalTitle'),
            id: document.getElementById('productId')
        }
    };

    // Inicialización
    init();

    async function init() {
        await loadCategories();
        setupEventListeners();
        await loadProducts();
    }

    function setupEventListeners() {
        elements.btnNew?.addEventListener('click', openModal);
    }

    async function loadCategories() {
        try {
            const response = await fetch('/proyecto-3er-trayecto/categories');
            const result = await response.json();
            
            if (result.status === 'success') {
                categories = result.data;
                populateCategorySelect();
            }
        } catch (error) {
            showNotification('Error al cargar categorías', 'error');
        }
    }

    function populateCategorySelect() {
        elements.categorySelect.innerHTML = categories.map(category => 
            `<option value="${category.id}">${category.nombre}</option>`
        ).join('');
    }

    function openModal() {
        elements.modal.classList.remove('hidden');
    }

    function closeModal() {
        elements.modal.classList.add('hidden');
        resetForm();
    }

    function resetForm() {
        elements.form.reset();
        currentProductId = null;
        elements.fields.modalTitle.textContent = 'Nuevo Producto';
        elements.fields.image.required = true;
    }

    async function loadProducts() {
        try {
            const response = await fetch(apiBaseUrl);
            const result = await response.json();
            
            if (result.status === 'success') {
                renderProducts(result.data);
            }
        } catch (error) {
            showNotification('Error al cargar productos', 'error');
        }
    }

    function renderProducts(products) {
    elements.list.innerHTML = products.map(product => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="px-6 py-4">
                ${product.imagen ? 
                    `<img src="${product.imagen}" 
                        class="w-12 h-12 object-cover rounded-full border-2 border-gray-200 dark:border-gray-600" 
                        alt="${product.nombre}">` : 
                    '<div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>'}
            </td>
            <td class="px-6 py-4 dark:text-white">${product.nombre}</td>
            <td class="px-6 py-4 dark:text-white">${getCategoryName(product.categoria_id)}</td>
            <td class="px-6 py-4 dark:text-white">${product.stock}</td>
            <td class="px-6 py-4">
                <button onclick="editProduct(${product.id})" class="text-blue-600 hover:underline">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:underline ml-3">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

    function getCategoryName(categoryId) {
        const category = categories.find(c => c.id == categoryId);
        return category ? category.nombre : 'Sin categoría';
    }

    async function saveProduct() {
        const formData = new FormData();
        formData.append('nombre', elements.fields.name.value);
        formData.append('descripcion', elements.fields.description.value);
        formData.append('categoria_id', elements.categorySelect.value);
        formData.append('stock', elements.fields.stock.value);
        
        if (elements.fields.image.files[0]) {
            formData.append('imagen', elements.fields.image.files[0]);
        }

        try {
            const url = currentProductId ? `${apiBaseUrl}/${currentProductId}` : apiBaseUrl;
            const method = currentProductId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                body: formData
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                await loadProducts();
                closeModal();
                showNotification(currentProductId ? 'Producto actualizado' : 'Producto creado', 'success');
            }
        } catch (error) {
            showNotification('Error al guardar el producto', 'error');
        }
    }

    async function editProduct(id) {
        try {
            const response = await fetch(`${apiBaseUrl}/${id}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                const product = result.data;
                currentProductId = id;
                
                elements.fields.name.value = product.nombre;
                elements.fields.description.value = product.descripcion;
                elements.categorySelect.value = product.categoria_id;
                elements.fields.stock.value = product.stock;
                elements.fields.modalTitle.textContent = 'Editar Producto';
                elements.fields.image.required = false;
                
                openModal();
            }
        } catch (error) {
            showNotification('Error al cargar producto', 'error');
        }
    }

    let deleteProductId = null;

    async function deleteProduct(id) {
        deleteProductId = id;
        openDeleteModal();
    }

    function openDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.remove('hidden');
        }
    }

    function closeDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.add('hidden');
        }
        deleteProductId = null;
    }

    async function confirmDelete() {
        if (!deleteProductId) return;
        
        try {
            const response = await fetch(`${apiBaseUrl}/${deleteProductId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                await loadProducts();
                showNotification('Producto eliminado correctamente', 'success');
            } else {
                showNotification(result.message || 'Error al eliminar producto', 'error');
            }
        } catch (error) {
            showNotification('Error al eliminar producto', 'error');
        } finally {
            closeDeleteModal();
        }
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    // Funciones globales necesarias para los eventos onClick en HTML
    window.openProductModal = openModal;
    window.closeProductModal = closeModal;
    window.saveProduct = saveProduct;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.closeDeleteModal = closeDeleteModal;
    window.confirmDeleteProduct = confirmDelete;
});