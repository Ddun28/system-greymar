
document.addEventListener('DOMContentLoaded', () => {

    const authData = localStorage.getItem('authData');
    if( !authData){
        window.location.href = '/proyecto-3er-trayecto/login';
    }

    const apiBaseUrl = '/proyecto-3er-trayecto/users'; 
    let currentUserId = null;
    let deleteUserId = null;
    
    // Elementos del DOM
    const elements = {
        modal: document.getElementById('userModal'),
        deleteModal: document.getElementById('deleteModal'),
        form: document.getElementById('userForm'),
        usersList: document.getElementById('users-list'),
        btnNew: document.querySelector('.bg-blue-600'),
        confirmDelete: document.getElementById('confirmDelete'),
        cancelDelete: document.getElementById('cancelDelete'),
        btnClose: document.querySelector('#userModal button'), // Botón de cerrar (X)
        btnCancel: document.querySelector('#userForm button[type="button"]'), // Botón Cancelar
        fields: {
            modalTitle: document.getElementById('modalTitle'),
            nombre: document.getElementById('nombre'),
            apellido: document.getElementById('apellido'),
            usuario: document.getElementById('usuario'),
            correo: document.getElementById('correo'),
            cargo: document.getElementById('cargo'),
            password: document.getElementById('password'),
            userId: document.getElementById('userId')
        }
    };

    // Inicialización
    init();

    async function init() {
        setupEventListeners();
        await loadUsers();
    }

        function setupEventListeners() {
        // Botón Nuevo Usuario
        elements.btnNew?.addEventListener('click', openModal);
        
        // Formulario
        elements.form?.addEventListener('submit', handleSubmit);
        
        // Delegación de eventos para la tabla
        elements.usersList?.addEventListener('click', handleTableClick);
        
        // Modales
        elements.confirmDelete?.addEventListener('click', handleConfirmDelete);
        elements.cancelDelete?.addEventListener('click', closeDeleteModal);
        elements.btnClose?.addEventListener('click', closeModal);
        elements.btnCancel?.addEventListener('click', closeModal);

        // Cierre con ESC y clic fuera
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        elements.modal?.addEventListener('click', (e) => {
            if (e.target === elements.modal) closeModal();
        });
    }


     function openModal() {
        elements.modal.classList.remove('hidden');
        elements.fields.modalTitle.textContent = 'Nuevo Usuario';
    }

    function closeModal() {
        elements.modal.classList.add('hidden');
        resetForm();
    }

    function openDeleteModal() {
        elements.deleteModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        elements.deleteModal.classList.add('hidden');
        deleteUserId = null;
    }

       function resetForm() {
        elements.form.reset();
        currentUserId = null;
        elements.fields.cargo.value = 'admin';
        elements.fields.password.required = true;
        elements.fields.modalTitle.textContent = 'Nuevo Usuario';
    }

    async function loadUsers() {
    try {
        // Agregar caché-buster
        const timestamp = new Date().getTime();
        const response = await fetch(`${apiBaseUrl}?_=${timestamp}`);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Renderizar con animación
            elements.usersList.style.opacity = '0';
            setTimeout(() => {
                renderUsers(result.data);
                elements.usersList.style.opacity = '1';
            }, 300);
        } else {
            throw new Error(result.message || 'Error en estructura de datos');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Error en loadUsers:', error);
    }
}

    function renderUsers(users) {
    // Limpieza profunda del contenedor
    while (elements.usersList.firstChild) {
        elements.usersList.removeChild(elements.usersList.firstChild);
    }
    
    // Crear fragmento de documento
    const fragment = document.createDocumentFragment();
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-800';
        tr.innerHTML = `
            <td class="px-6 dark:text-white py-4">${user.nombre}</td>
            <td class="px-6 dark:text-white py-4">${user.usuario}</td>
            <td class="px-6 dark:text-white py-4">${user.correo}</td>
            <td class="px-6 dark:text-white py-4">${getRoleName(user.cargo)}</td>
            <td class="px-6 py-4 flex space-x-2">
                <button data-action="edit" data-id="${user.id}" class="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                    <i class="fas fa-edit"></i>
                </button>
                <button data-action="delete" data-id="${user.id}" class="text-red-600 hover:text-red-800 dark:text-red-400">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        fragment.appendChild(tr);
    });
    
    elements.usersList.appendChild(fragment);
}

    async function handleTableClick(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const userId = button.dataset.id;

        if (action === 'edit') await editUser(userId);
        if (action === 'delete') {
            deleteUserId = userId;
            openDeleteModal();
        }
    }

    async function editUser(userId) {
    try {

        const response = await fetch(`${apiBaseUrl}/${userId}?_=${Date.now()}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        
        const user = result.data;
        currentUserId = user.id;
        
        // Llenar formulario con datos actualizados
        elements.fields.nombre.value = user.nombre;
        elements.fields.apellido.value = user.apellido;
        elements.fields.usuario.value = user.usuario;
        elements.fields.correo.value = user.correo;
        elements.fields.cargo.value = user.cargo;
        
        // Resetear campo de contraseña
        elements.fields.password.value = '';
        elements.fields.password.required = false;
        
        openModal();
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Error en editUser:', error);
    }
}

    async function handleConfirmDelete() {
        if (!deleteUserId) return;
        
        try {
            const response = await fetch(`${apiBaseUrl}/${deleteUserId}`, {method: 'DELETE'});
            const result = await response.json();
            
            if (result.status === 'success') {
                
                const row = document.querySelector(`tr[data-id="${deleteUserId}"]`);
                if (row) row.remove();
                await loadUsers();  // Actualización inmediata
                showNotification('Usuario eliminado', 'success');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            closeDeleteModal();
        }
    }


    async function handleSubmit(event) {
    event.preventDefault();
    
    const userData = {
        nombre: elements.fields.nombre.value,
        apellido: elements.fields.apellido.value,
        usuario: elements.fields.usuario.value,
        correo: elements.fields.correo.value,
        cargo: elements.fields.cargo.value,
        password: elements.fields.password.value
    };

    try {
        const method = currentUserId ? 'PUT' : 'POST';
        const url = currentUserId ? `${apiBaseUrl}/${currentUserId}` : apiBaseUrl;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            elements.modal.classList.add('bg-green-100');
            await loadUsers(); 
            closeModal();
            showNotification(result.message, 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

    function getRoleName(role) {
        const roles = {
            admin: 'Administrador',
            empleado: 'Empleado',
            inventario: 'Inventario'
        };
        return roles[role] || 'Desconocido';
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-[1000] ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }

    // En la función setupEventListeners()
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.modal.classList.contains('hidden')) {
        closeModal();
    }
});

elements.modal?.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
        closeModal();
    }
});

});

