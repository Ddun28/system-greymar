document.addEventListener('DOMContentLoaded', () => {

    const authData = localStorage.getItem('authData');
    if( !authData){
        window.location.href = '/proyecto-3er-trayecto/login';
    }

    const apiBaseUrl = '/proyecto-3er-trayecto/categories';
    let currentCategoryId = null;
    
    // Elementos del DOM
    const elements = {
        modal: document.getElementById('categoryModal'),
        deleteModal: document.getElementById('deleteModal'),
        form: document.getElementById('categoryForm'),
        list: document.getElementById('categories-list'),
        btnNew: document.querySelector('.bg-blue-600'),
        btnClose: document.querySelector('#categoryModal button'),
        btnCancel: document.querySelector('#categoryForm button[type="button"]'),
        confirmDelete: document.getElementById('confirmDelete'),
        cancelDelete: document.getElementById('cancelDelete'),
        fields: {
            name: document.getElementById('categoryName'),
            description: document.getElementById('categoryDescription'),
            modalTitle: document.getElementById('categoryModalTitle'),
            id: document.getElementById('categoryId')
        }
    };

    // Inicialización
    init();

    async function init() {
        setupEventListeners();
        await loadCategories();
    }

    function setupEventListeners() {
        // Botones principales
        elements.btnNew?.addEventListener('click', openModal);
        elements.btnClose?.addEventListener('click', closeModal);
        elements.btnCancel?.addEventListener('click', closeModal);
        
        // Delegación de eventos
        elements.list?.addEventListener('click', handleTableClick);
        elements.form?.addEventListener('submit', handleSubmit);
        elements.confirmDelete?.addEventListener('click', handleConfirmDelete);
        elements.cancelDelete?.addEventListener('click', closeDeleteModal);
        
        // Cierre con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!elements.modal.classList.contains('hidden')) closeModal();
                if (!elements.deleteModal.classList.contains('hidden')) closeDeleteModal();
            }
        });
    }

    function openModal() {
        elements.modal.classList.remove('hidden');
    }

    function closeModal() {
        elements.modal.classList.add('hidden');
        resetForm();
    }

    function openDeleteModal(id) {
        elements.deleteModal.classList.remove('hidden');
        currentCategoryId = id;
    }

    function closeDeleteModal() {
        elements.deleteModal.classList.add('hidden');
        currentCategoryId = null;
    }

    function resetForm() {
        elements.form.reset();
        currentCategoryId = null;
        elements.fields.modalTitle.textContent = 'Nueva Categoría';
        elements.fields.id.value = '';
    }

    async function loadCategories() {
        try {
            const response = await fetch(apiBaseUrl);
            const result = await response.json();
            
            if (result.status === 'success') {
                renderCategories(result.data);
            }
        } catch (error) {
            showNotification('Error al cargar categorías', 'error');
        }
    }

    function renderCategories(categories) {
        elements.list.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        categories.forEach(category => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-800';
            tr.innerHTML = `
                <td class="px-6 py-4 dark:text-white">${category.nombre}</td>
                <td class="px-6 py-4 dark:text-white">${category.descripcion || '-'}</td>
                <td class="px-6 py-4">
                    <button data-action="edit" data-id="${category.id}" class="text-blue-600 hover:underline">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button data-action="delete" data-id="${category.id}" class="text-red-600 hover:underline ml-3">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>`;
            fragment.appendChild(tr);
        });
        elements.list.appendChild(fragment);
    }

    async function handleTableClick(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const categoryId = button.dataset.id;

        if (action === 'edit') await editCategory(categoryId);
        if (action === 'delete') openDeleteModal(categoryId);
    }

    async function editCategory(id) {
        try {
            const response = await fetch(`${apiBaseUrl}/${id}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                const category = result.data;
                currentCategoryId = category.id;
                elements.fields.name.value = category.nombre;
                elements.fields.description.value = category.descripcion;
                elements.fields.modalTitle.textContent = 'Editar Categoría';
                elements.fields.id.value = category.id;
                openModal();
            }
        } catch (error) {
            showNotification('Error al cargar categoría', 'error');
        }
    }

    async function handleConfirmDelete() {
        try {
            const response = await fetch(`${apiBaseUrl}/${currentCategoryId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                await loadCategories();
                showNotification(result.message, 'success');
            }
        } catch (error) {
            showNotification('Error al eliminar categoría', 'error');
        } finally {
            closeDeleteModal();
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        
        const categoryData = {
            nombre: elements.fields.name.value,
            descripcion: elements.fields.description.value
        };

        try {
            const method = currentCategoryId ? 'PUT' : 'POST';
            const url = currentCategoryId ? `${apiBaseUrl}/${currentCategoryId}` : apiBaseUrl;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                await loadCategories();
                closeModal();
                showNotification(result.message, 'success');
            }
        } catch (error) {
            showNotification('Error al guardar cambios', 'error');
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
});