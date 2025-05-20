// index.js para la gestión de movimientos

// Cargar movimientos y productos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadMovements();
    loadProducts(); // Cargar productos al iniciar
});

// Función para cargar movimientos
async function loadMovements() {
    try {
        const response = await fetch('/proyecto-3er-trayecto/movimientos?limit=10');
        const result = await response.json();

        if (result.status === 'success') {
            const movementsList = document.getElementById('movements-list');
            movementsList.innerHTML = ''; // Limpiar la lista antes de cargar

            result.data.forEach(movement => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 dark:text-white py-4">${new Date(movement.created_at).toLocaleDateString()}</td>
                    <td class="px-6 dark:text-white py-4">${movement.producto_id}</td>
                    <td class="px-6 dark:text-white py-4">${movement.cantidad}</td>
                    <td class="px-6 dark:text-white py-4">${movement.tipo}</td>
                    <td class="px-6 py-4">
                        <button onclick="editMovement(${movement.id})" class="text-blue-600 hover:underline">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteMovement(${movement.id})" class="text-red-600 hover:underline">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                movementsList.appendChild(row);
            });
        } else {
            console.error(result.message);
        }
    } catch (error) {
        console.error('Error al cargar movimientos:', error);
    }
}

// Función para cargar productos
async function loadProducts() {
    try {
        const response = await fetch('/proyecto-3er-trayecto/products');
        const result = await response.json();

        if (result.status === 'success') {
            const productSelect = document.getElementById('movementProduct');
            productSelect.innerHTML = ''; // Limpiar el select antes de cargar

            result.data.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id; // Asegúrate de que el ID del producto sea correcto
                option.textContent = product.nombre; // Asegúrate de que el nombre del producto sea correcto
                productSelect.appendChild(option);
            });
        } else {
            console.error(result.message);
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Función para abrir el modal de nuevo movimiento
const openMovementModal = () => {
    document.getElementById('movementModal').classList.remove('hidden');
};

// Función para cerrar el modal de movimiento
const closeMovementModal = () => {
    document.getElementById('movementModal').classList.add('hidden');
    document.getElementById('movementForm').reset(); // Limpiar el formulario
};

let selectedMovementId = null;

// Función para mostrar notificación
const showNotification = (message, isError = false) => {
    const icon = document.getElementById('notificationIcon');
    const text = document.getElementById('notificationText');
    
    icon.className = isError ? 'fas fa-times-circle text-3xl mb-4 text-red-500' : 'fas fa-check-circle text-3xl mb-4 text-green-500';
    text.textContent = message;
    document.getElementById('notificationModal').classList.remove('hidden');
}

// Cerrar notificación
const closeNotification = () => {
    document.getElementById('notificationModal').classList.add('hidden');
}

// Mostrar modal de eliminación
const showDeleteModal = (id) => {
    selectedMovementId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
}

// Cerrar modal de eliminación
const closeDeleteModal = () => {
    selectedMovementId = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

// Confirmar eliminación
const confirmDelete = async () => {
    if (!selectedMovementId) return;
    
    try {
        const response = await fetch(`/proyecto-3er-trayecto/movimientos/${selectedMovementId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification('Movimiento eliminado correctamente');
            loadMovements();
        } else {
            showNotification(result.message, true);
        }
    } catch (error) {
        showNotification('Error al eliminar movimiento', true);
    }
    closeDeleteModal();
}

const editMovement = async (id) => {
    try {
        const response = await fetch(`/proyecto-3er-trayecto/movimientos/${id}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            document.getElementById('movementId').value = id;
            document.getElementById('movementProduct').value = result.data.producto_id;
            document.getElementById('movementQuantity').value = result.data.cantidad;
            document.getElementById('movementType').value = result.data.tipo;
            document.getElementById('movementReason').value = result.data.motivo;
            
            document.getElementById('movementModalTitle').textContent = 'Editar Movimiento';
            openMovementModal();
        }
    } catch (error) {
        showNotification('Error al cargar movimiento', true);
    }
}


const saveMovement = async () => {
    const movementId = document.getElementById('movementId').value;
    const isEdit = !!movementId;
    
    const movementData = {
        id: movementId,
        product_id: document.getElementById('movementProduct').value,
        tipo: document.getElementById('movementType').value,
        cantidad: document.getElementById('movementQuantity').value,
        motivo: document.getElementById('movementReason').value
    };

    try {
        const url = isEdit 
            ? `/proyecto-3er-trayecto/movimientos/${movementId}`
            : '/proyecto-3er-trayecto/movimientos';
            
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movementData)
        });
        
        const result = await response.json();

        if (result.status === 'success') {
            showNotification(isEdit ? 'Movimiento actualizado' : 'Movimiento creado');
            closeMovementModal();
            loadMovements();
        } else {
            showNotification(result.message, true);
        }
    } catch (error) {
        showNotification('Error al guardar movimiento', true);
    }
}

// Actualizar función de eliminación
const deleteMovement = (movementId) => {
    showDeleteModal(movementId);
}