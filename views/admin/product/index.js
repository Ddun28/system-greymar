document.addEventListener('DOMContentLoaded', () => {

    const authData = localStorage.getItem('authData');
    if (!authData) {
        window.location.href = '/proyecto-3er-trayecto/login';
        return;
    }

    const apiBaseUrl = '/proyecto-3er-trayecto/products';
    let currentProductId = null;
    let categories = [];
    let exchangeRate = null; // Bs por USD

    // Cache de tasa en localStorage (TTL 24h)
    async function getCachedExchangeRate() {
        const key = 'exchangeRateData';
        try {
            const raw = localStorage.getItem(key);
            const now = Date.now();
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.rate && parsed.fetchedAt && (now - parsed.fetchedAt) < 24 * 60 * 60 * 1000) {
                    return parsed.rate;
                }
            }
        } catch (e) {
            console.warn('Error leyendo cache de tasa (productos):', e);
        }

        try {
            const resp = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
            const json = await resp.json();
            const rate = json && parseFloat(json.promedio) || null;
            const data = { rate, fetchedAt: Date.now(), raw: json };
            try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { }
            return rate;
        } catch (e) {
            console.warn('No se pudo obtener tasa desde API (productos):', e);
            return null;
        }
    }

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
            price: document.getElementById('productPrice'),
            minStock: document.getElementById('productMinStock'),
            image: document.getElementById('productImage'),
            imagePreview: document.getElementById('productImagePreview'),
            existingImage: document.getElementById('productExistingImage'),
            modalTitle: document.getElementById('productModalTitle'),
            id: document.getElementById('productId')
        }
    };

    // Botón y elementos de estado para guardar
    elements.saveButton = document.getElementById('saveProductButton');
    elements.saveSpinner = document.getElementById('saveSpinner');
    elements.saveButtonText = document.getElementById('saveButtonText');
    elements.cancelButton = document.getElementById('cancelProductButton');

    // Inicialización
    init();

    async function init() {
        // Obtener tasa (cache diario) para mostrar precios en Bs
        try {
            exchangeRate = await getCachedExchangeRate();
        } catch (e) {
            exchangeRate = null;
        }

        await loadCategories();
        setupEventListeners();
        await loadProducts();
    }

    // Escuchar actualizaciones de la tasa y recargar listado
    window.addEventListener('exchangeRateUpdated', (e) => {
        try {
            exchangeRate = e && e.detail && e.detail.rate ? e.detail.rate : null;
        } catch (err) {
            exchangeRate = null;
        }
        // recargar para mostrar Bs actualizados
        loadProducts();
    });

    function setupEventListeners() {
        elements.btnNew?.addEventListener('click', openModal);
        // actualizar preview cuando el usuario selecciona una nueva imagen
        if (elements.fields.image) {
            elements.fields.image.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const previewContainer = document.getElementById('productImagePreviewContainer');
                if (file) {
                    const url = URL.createObjectURL(file);
                    if (elements.fields.imagePreview) {
                        elements.fields.imagePreview.src = url;
                        previewContainer?.classList.remove('hidden');
                    }
                } else {
                    if (elements.fields.existingImage && elements.fields.existingImage.value) {
                        if (elements.fields.imagePreview) elements.fields.imagePreview.src = elements.fields.existingImage.value;
                        previewContainer?.classList.remove('hidden');
                    } else {
                        if (elements.fields.imagePreview) elements.fields.imagePreview.src = '';
                        previewContainer?.classList.add('hidden');
                    }
                }
            });
        }
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
        if (elements.fields.existingImage) elements.fields.existingImage.value = '';
        if (elements.fields.imagePreview) {
            elements.fields.imagePreview.src = '';
            document.getElementById('productImagePreviewContainer')?.classList.add('hidden');
        }
        if (elements.fields.minStock) elements.fields.minStock.value = 5;
        if (elements.fields.price) elements.fields.price.value = '';
    }

    async function loadProducts() {
        setListLoading(true);
        try {
            const response = await fetch(apiBaseUrl);
            const result = await response.json();

            if (result && result.status === 'success') {
                renderProducts(result.data);
            } else if (result && Array.isArray(result.data) && result.data.length === 0) {
                // API devolvió estructura diferente pero sin registros
                renderProducts([]);
            } else {
                throw new Error((result && result.message) || 'Error al cargar productos');
            }
        } catch (error) {
            showNotification('Error al cargar productos', 'error');
        } finally {
            setListLoading(false);
        }
    }

    function renderProducts(products) {
        if (!elements.list) {
            console.error('renderProducts: element #products-list no encontrado');
            return;
        }

        if (!products || products.length === 0) {
            elements.list.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-6">No hay registros</td></tr>';
            return;
        }

        elements.list.innerHTML = products.map(product => {
        const isLowStock = product.stock <= (product.stock_minimo || 5);
        const stockClass = isLowStock ? 'text-red-600 dark:text-red-400 font-semibold' : 'dark:text-white';
        return `
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
            <td class="px-6 py-4 dark:text-white">${(() => {
                const priceNum = parseFloat(product.precio ?? product.precio_venta ?? 0) || 0;
                const priceBs = exchangeRate ? (priceNum * exchangeRate).toFixed(2) : null;
                return `$${priceNum.toFixed(2)}${priceBs ? ` <span class="text-xs text-gray-400">(Bs. ${priceBs})</span>` : ''}`;
            })()}</td>
            <td class="px-6 py-4 ${stockClass}">
                ${product.stock}
                ${isLowStock ? '<i class="fas fa-exclamation-triangle text-yellow-500 ml-1" title="Stock bajo"></i>' : ''}
            </td>
            <td class="px-6 py-4">
                <button onclick="editProduct(${product.id})" class="text-blue-600 hover:underline">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:underline ml-3">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;}).join('');
}

    function getCategoryName(categoryId) {
        const category = categories.find(c => c.id == categoryId);
        return category ? category.nombre : 'Sin categoría';
    }

    async function saveProduct() {
        // Validar campos antes de enviar
        const validation = validateForm();
        if (!validation.valid) {
            highlightFields(validation.fields);
            showNotification(validation.message, 'error');
            return;
        }

        // Indicar estado de guardado
        setSaving(true, 'Guardando...');
        const formData = new FormData();
        formData.append('nombre', elements.fields.name.value);
        formData.append('descripcion', elements.fields.description.value);
        formData.append('categoria_id', elements.categorySelect.value);
        formData.append('stock', elements.fields.stock.value);
        formData.append('precio', elements.fields.price?.value || 0);
        formData.append('stock_minimo', elements.fields.minStock?.value || 5);
        
        if (elements.fields.image.files[0]) {
            formData.append('imagen', elements.fields.image.files[0]);
        } else if (elements.fields.existingImage && elements.fields.existingImage.value) {
            // enviar referencia a la imagen existente para que el backend la mantenga
            formData.append('imagen_actual', elements.fields.existingImage.value);
        }

        try {
            const url = currentProductId ? `${apiBaseUrl}/${currentProductId}` : apiBaseUrl;
            // Para editar con multipart, usar POST + X-HTTP-Method-Override: PUT para que PHP procese $_FILES
            const isEdit = !!currentProductId;
            const fetchOptions = {
                method: 'POST',
                body: formData,
                headers: {}
            };
            if (isEdit) {
                fetchOptions.headers['X-HTTP-Method-Override'] = 'PUT';
            }

            const response = await fetch(url, fetchOptions);

            let result;
            try {
                result = await response.json();
            } catch (err) {
                result = null;
            }

            if (response.ok && result && (result.status === 'success' || result.success === true)) {
                await loadProducts();
                closeModal();
                const successMsg = (result && result.message) ? result.message : (currentProductId ? 'Producto actualizado' : 'Producto creado');
                showNotification(successMsg, 'success');
            } else {
                // Priorizar mensajes del servidor en varios formatos
                const msg = (result && (result.message || result.error_message)) || (!response.ok ? response.statusText : 'Error al guardar el producto');
                showNotification(msg, 'error');
            }
        } catch (error) {
            console.error('saveProduct error:', error);
            showNotification('Error de red al guardar el producto', 'error');
        } finally {
            setTimeout(() => setSaving(false), 200); // pequeño retardo para UX
        }
    }

    function validateForm() {
        const required = [];
        const fieldsWithErrors = [];

        if (!elements.fields.name.value.trim()) {
            required.push('Nombre');
            fieldsWithErrors.push(elements.fields.name);
        }
        if (!elements.categorySelect.value) {
            required.push('Categoría');
            fieldsWithErrors.push(elements.categorySelect);
        }
        if (!elements.fields.stock.value || isNaN(elements.fields.stock.value)) {
            required.push('Stock');
            fieldsWithErrors.push(elements.fields.stock);
        }
        if (!currentProductId && (!elements.fields.image.files || !elements.fields.image.files[0])) {
            required.push('Imagen');
            fieldsWithErrors.push(elements.fields.image);
        }

        if (required.length > 0) {
            return { valid: false, message: 'Complete los campos: ' + required.join(', '), fields: fieldsWithErrors };
        }
        return { valid: true };
    }

    function highlightFields(fields) {
        // agregar clase temporal para indicar error
        fields.forEach(f => {
            f.classList.add('border-red-500', 'ring-1', 'ring-red-300');
            setTimeout(() => {
                f.classList.remove('border-red-500', 'ring-1', 'ring-red-300');
            }, 3000);
        });
        if (fields[0] && typeof fields[0].focus === 'function') fields[0].focus();
    }

    function setListLoading(isLoading) {
        if (!elements.list) return;
        if (isLoading) {
            elements.list.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-8">Cargando...</td></tr>';
            if (elements.btnNew) elements.btnNew.disabled = true;
        } else {
            if (elements.btnNew) elements.btnNew.disabled = false;
        }
    }

    function setSaving(isSaving, text) {
        if (elements.saveButton) elements.saveButton.disabled = isSaving;
        if (elements.saveSpinner) elements.saveSpinner.classList.toggle('hidden', !isSaving);
        if (elements.saveButtonText) elements.saveButtonText.textContent = isSaving ? (text || 'Guardando...') : 'Guardar';

        // Deshabilitar inputs del formulario
        const inputs = elements.form.querySelectorAll('input, textarea, select, button');
        inputs.forEach(inp => {
            // No deshabilitar el botón de cancelar para permitir cerrar
            if (elements.cancelButton && inp === elements.cancelButton) return;
            inp.disabled = isSaving;
        });
    }

    async function editProduct(id) {
        try {
            setSaving(true, 'Cargando...');
            const response = await fetch(`${apiBaseUrl}/${id}`);
            const result = await response.json();

            if (response.ok && result && (result.status === 'success' || result.success === true)) {
                const product = result.data;
                currentProductId = id;
                
                elements.fields.name.value = product.nombre;
                elements.fields.description.value = product.descripcion;
                elements.categorySelect.value = product.categoria_id;
                elements.fields.stock.value = product.stock;
                if (elements.fields.price) elements.fields.price.value = product.precio || 0;
                if (elements.fields.minStock) elements.fields.minStock.value = product.stock_minimo || 5;
                elements.fields.modalTitle.textContent = 'Editar Producto';
                elements.fields.image.required = false;
                // mostrar imagen existente en preview y guardar referencia
                if (product.imagen) {
                    if (elements.fields.existingImage) elements.fields.existingImage.value = product.imagen;
                    if (elements.fields.imagePreview) elements.fields.imagePreview.src = product.imagen;
                    document.getElementById('productImagePreviewContainer')?.classList.remove('hidden');
                } else {
                    if (elements.fields.existingImage) elements.fields.existingImage.value = '';
                    if (elements.fields.imagePreview) elements.fields.imagePreview.src = '';
                    document.getElementById('productImagePreviewContainer')?.classList.add('hidden');
                }

                openModal();
            }
        } catch (error) {
            showNotification('Error al cargar producto', 'error');
        } finally {
            setSaving(false);
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
            // Indicar estado de eliminación
            setSaving(true, 'Eliminando...');
            const response = await fetch(`${apiBaseUrl}/${deleteProductId}`, {
                method: 'DELETE'
            });

            let result = null;
            try { result = await response.json(); } catch(e) { result = null; }

            if (response.ok && result && (result.status === 'success' || result.success === true)) {
                await loadProducts();
                showNotification('Producto eliminado correctamente', 'success');
            } else {
                const msg = (result && result.message) || 'Error al eliminar producto';
                showNotification(msg, 'error');
            }
        } catch (error) {
            showNotification('Error al eliminar producto', 'error');
            console.error('delete error', error);
        } finally {
            setSaving(false);
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