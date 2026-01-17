// index.js para la gestión de movimientos

// Cargar movimientos y productos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadMovements();
    loadProducts(); // Cargar productos al iniciar
});

// Función para cargar movimientos
async function loadMovements() {
    try {
        const response = await fetch('/proyecto-3er-trayecto/movimientos?limit=50');
        const result = await response.json();

        if (result && result.status === 'success') {
            const movementsList = document.getElementById('movements-list');
            movementsList.innerHTML = ''; // Limpiar la lista antes de cargar

            if (!result.data || result.data.length === 0) {
                movementsList.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-6">No hay registros</td></tr>';
            } else {
                result.data.forEach(movement => {
                    const isEditable = movement.is_editable;
                    const row = document.createElement('tr');

                    const tipoBase = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ring-1 ring-inset transition-colors duration-150 select-none';
                    const tipoClass = movement.tipo === 'entrada'
                        ? tipoBase + ' bg-green-50 text-green-800 ring-green-200 hover:bg-green-100 dark:bg-green-700 dark:text-white dark:ring-green-600 dark:hover:bg-green-600'
                        : tipoBase + ' bg-red-50 text-red-800 ring-red-200 hover:bg-red-100 dark:bg-red-700 dark:text-white dark:ring-red-600 dark:hover:bg-red-600';

                    const tipoIcon = movement.tipo === 'entrada' ? '<i class="fas fa-arrow-down text-sm"></i>' : '<i class="fas fa-arrow-up text-sm"></i>';
                    const tipoLabel = movement.tipo ? (movement.tipo.charAt(0).toUpperCase() + movement.tipo.slice(1)) : '';

                    const actionHtml = isEditable
                        ? '<button onclick="editMovement(' + movement.id + ')" class="text-blue-600 hover:underline" title="Editar">' +
                          '<i class="fas fa-edit"></i>' +
                          '</button>' +
                          '<button onclick="deleteMovement(' + movement.id + ')" class="text-red-600 hover:underline ml-2" title="Eliminar">' +
                          '<i class="fas fa-trash"></i>' +
                          '</button>'
                        : '<span class="text-gray-400 text-sm" title="Solo se puede editar el último movimiento de cada producto">' +
                          '<i class="fas fa-lock"></i> Bloqueado' +
                          '</span>';

                    row.innerHTML =
                        '<td class="px-6 dark:text-white py-4">' + new Date(movement.created_at).toLocaleDateString() + '</td>' +
                        '<td class="px-6 dark:text-white py-4">' + (movement.producto_nombre || movement.producto_id) + '</td>' +
                        '<td class="px-6 dark:text-white py-4">' + movement.cantidad + '</td>' +
                        '<td class="px-6 py-4">' +
                            '<span class="' + tipoClass + '">' +
                                tipoIcon +
                                '<span class="capitalize">' + tipoLabel + '</span>' +
                            '</span>' +
                        '</td>' +
                        '<td class="px-6 py-4">' + actionHtml + '</td>';

                    movementsList.appendChild(row);
                });
            }
        } else if (result && Array.isArray(result.data) && result.data.length === 0) {
            const movementsList = document.getElementById('movements-list');
            movementsList.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-6">No hay registros</td></tr>';
        } else {
            console.error(result && result.message ? result.message : 'Error al cargar movimientos');
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
    // Reset form and state for creating a new movement
    const form = document.getElementById('movementForm');
    if (form) form.reset();
    const idField = document.getElementById('movementId');
    if (idField) idField.value = '';
    const title = document.getElementById('movementModalTitle');
    if (title) title.textContent = 'Nuevo Movimiento';
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
        
        if (result.status === 'success' && result.data) {
            const movement = result.data;
            
            // Verificar si es editable
            if (!movement.is_editable) {
                showNotification('Solo se puede editar el último movimiento de este producto', true);
                return;
            }
            
            // Cargar productos primero para asegurar que el select esté poblado
            await loadProducts();
            
            // Establecer los valores del formulario
            document.getElementById('movementId').value = id;
            document.getElementById('movementProduct').value = movement.producto_id;
            document.getElementById('movementQuantity').value = movement.cantidad;
            document.getElementById('movementType').value = movement.tipo;
            document.getElementById('movementReason').value = movement.motivo || '';
            
            document.getElementById('movementModalTitle').textContent = 'Editar Movimiento';
            document.getElementById('movementModal').classList.remove('hidden');
        } else {
            showNotification('Error al cargar el movimiento', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar movimiento', true);
    }
}


const saveMovement = async () => {
    const movementId = document.getElementById('movementId').value;
    const isEdit = !!movementId;
    const productValue = document.getElementById('movementProduct').value;
    const tipoValue = document.getElementById('movementType').value;
    const cantidadValue = document.getElementById('movementQuantity').value;
    const motivoValue = document.getElementById('movementReason').value;

    // Client-side validation to provide clearer feedback
    if (!productValue) {
        showNotification('Seleccione un producto', true);
        return;
    }
    if (!cantidadValue || Number(cantidadValue) <= 0) {
        showNotification('Ingrese una cantidad válida', true);
        return;
    }
    if (!tipoValue) {
        showNotification('Seleccione un tipo de movimiento', true);
        return;
    }

    const movementData = {
        id: movementId,
        product_id: productValue,
        tipo: tipoValue,
        cantidad: Number(cantidadValue),
        motivo: motivoValue
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

// Exponer funciones globalmente usadas por atributos onclick en el HTML
window.openMovementModal = openMovementModal;
window.closeMovementModal = closeMovementModal;
window.saveMovement = saveMovement;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.showDeleteModal = showDeleteModal;