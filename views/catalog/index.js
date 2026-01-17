document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = '/proyecto-3er-trayecto/products';
    const categoriesUrl = '/proyecto-3er-trayecto/categories';
    
    let allProducts = [];
    let allCategories = [];
    let currentPage = 1;
    const pageSize = 12;

    // Elementos del DOM
    const elements = {
        productsGrid: document.getElementById('productsGrid'),
        loader: document.getElementById('loader'),
        noResults: document.getElementById('noResults'),
        noResultsIcon: document.getElementById('noResultsIcon'),
        noResultsText: document.getElementById('noResultsText'),
        categoryFilter: document.getElementById('categoryFilter'),
        searchInput: document.getElementById('searchInput'),
        clearFiltersBtn: document.getElementById('clearFilters')
        ,retryBtn: document.getElementById('retryLoad')
        ,paginationContainer: document.getElementById('pagination')
    };

    // Inicialización
    init();

    async function init() {
        AOS.init({
            once: true,
            duration: 800
        });
        // obtener tasa de cambio desde cache (TTL 24h) si está disponible
        window.catalogExchangeRate = null;
        try {
            const raw = localStorage.getItem('exchangeRateData');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.rate && parsed.fetchedAt && (Date.now() - parsed.fetchedAt) < 24 * 60 * 60 * 1000) {
                    window.catalogExchangeRate = parseFloat(parsed.rate) || null;
                }
            }
        } catch (e) {
            console.warn('Error leyendo cache de tasa (catalog):', e);
            window.catalogExchangeRate = null;
        }

        // Escuchar actualizaciones forzadas de la tasa
        window.addEventListener('exchangeRateUpdated', (e) => {
            try {
                window.catalogExchangeRate = e && e.detail && e.detail.rate ? e.detail.rate : null;
            } catch (err) {
                window.catalogExchangeRate = null;
            }
            // re-renderizar con la nueva tasa
            renderProducts(allProducts);
        });

        await Promise.all([loadCategories(), loadProducts()]);
        setupEventListeners();
    }

    function setupEventListeners() {
        elements.categoryFilter.addEventListener('change', filterProducts);
        elements.searchInput.addEventListener('input', () => { currentPage = 1; filterProducts(); });
        if (elements.clearFiltersBtn) {
            elements.clearFiltersBtn.addEventListener('click', () => {
                elements.categoryFilter.value = '';
                elements.searchInput.value = '';
                currentPage = 1;
                renderProducts(allProducts);
                // ensure any previous hidden/noResults state is reset
                hideNoResults();
                elements.productsGrid.style.display = 'grid';
            });
        }

        if (elements.retryBtn) {
            elements.retryBtn.addEventListener('click', () => {
                if (elements.noResults) elements.noResults.style.display = 'none';
                try { elements.loader.style.display = 'flex'; } catch (e) {}
                loadProducts();
            });
        }
        // pagination clicks (event delegation)
        if (elements.paginationContainer) {
            elements.paginationContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-page]');
                if (!btn) return;
                const page = Number(btn.getAttribute('data-page'));
                if (!Number.isNaN(page)) goToPage(page);
            });
        }
    }

    async function loadCategories() {
        try {
            const response = await fetch(categoriesUrl);
            const result = await response.json();
            
            if (result.status === 'success') {
                allCategories = result.data;
                populateCategoryFilter();
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }

    function populateCategoryFilter() {
        const options = allCategories.map(cat => 
            `<option value="${cat.id}">${cat.nombre}</option>`
        ).join('');
        
        elements.categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' + options;
    }

    async function loadProducts() {
        // show loader when (re)loading
        try {
            elements.loader.style.display = 'flex';
        } catch (e) {}
        try {
            const response = await fetch(apiBaseUrl);
            const result = await response.json();
            
            if (result.status === 'success') {
                allProducts = result.data;
                renderProducts(allProducts);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            showNoResults('Ocurrió un error al cargar los productos. Por favor, inténtalo de nuevo más tarde.', true);
        } finally {
            hideLoader();
        }
    }

    function renderProducts(products) {
        // Ensure the grid is visible (use inline style to override previous hide)
        elements.productsGrid.style.display = 'grid';
        hideNoResults();

        if (!Array.isArray(products) || products.length === 0) {
            showNoResults('No se encontraron productos', false);
            renderPagination(0);
            return;
        }

        // Pagination: determine slice for current page
        const totalItems = products.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageProducts = products.slice(start, end);

            const productCards = pageProducts.map((product, index) => {
            const categoryName = getCategoryName(product.categoria_id);
            const stockColor = product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600';
            const hasStock = product.stock > 0;
            const priceVal = product.precio ?? product.price ?? product.precio_venta ?? null;
            const priceNum = priceVal !== null ? (parseFloat(priceVal) || 0) : null;
            const priceBs = (priceNum !== null && window.catalogExchangeRate) ? (priceNum * window.catalogExchangeRate).toFixed(2) : null;

            return `
            <div class="native-card" data-aos="fade-up" data-aos-delay="${Math.min(index * 50, 300)}">
                <div class="relative native-card-media cursor-pointer" onclick="viewProductDetail(${product.id})">
                    ${product.imagen ? 
                        `<img src="${product.imagen}" alt="${product.nombre}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%239CA3AF%22%3ESin imagen%3C/text%3E%3C/svg%3E'">` :
                        `<div class="w-full h-full flex items-center justify-center bg-gray-50"><i class="fas fa-image text-4xl text-gray-300"></i></div>`
                    }
                    ${hasStock ? 
                        `<div class="absolute top-3 left-3 bg-white/90 text-gray-800 px-3 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-2"><i class="fas fa-check text-green-500"></i><span>Disponible</span></div>` :
                        `<div class="absolute top-3 left-3 bg-white/90 text-gray-800 px-3 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-2"><i class="fas fa-times text-red-500"></i><span>Agotado</span></div>`
                    }
                </div>
                <div class="native-card-body">
                    <div class="native-card-meta">
                        <span class="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">${categoryName}</span>
                        <span class="text-sm text-gray-600"> <i class="fas fa-box text-indigo-500 mr-1"></i><span class="font-semibold ${stockColor}">${product.stock}</span></span>
                    </div>
                    <h3 class="text-base font-semibold text-gray-800 leading-snug line-clamp-2" title="${product.nombre}">${product.nombre}</h3>
                    <p class="text-sm text-gray-500 line-clamp-2">${product.descripcion || 'Sin descripción disponible'}</p>
                    <div class="mt-2 native-card-meta">
                        <div class="native-card-price">${priceNum !== null ? `$${priceNum.toFixed(2)}${priceBs ? ` <span class=\"text-xs text-gray-400\">(Bs. ${priceBs})</span>` : ''}` : ''}</div>
                        <div class="native-card-actions">
                            <button class="btn-outline" onclick="viewProductDetail(${product.id})">Ver</button>
                            <button class="btn-primary" onclick="viewProductDetail(${product.id})">Detalles</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });

        elements.productsGrid.innerHTML = productCards.join('');

        // Render pagination controls
        renderPagination(totalItems);
    }

    function formatPrice(value){
        if (value === null || value === undefined) return '';
        const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g,''));
        if (Number.isNaN(num)) return String(value);
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(num);
    }

    function getCategoryName(categoryId) {
        const category = allCategories.find(c => c.id == categoryId);
        return category ? category.nombre : 'Sin categoría';
    }

    function filterProducts() {
        const categoryId = elements.categoryFilter.value;
        const searchTerm = (elements.searchInput.value || '').toLowerCase().trim();

        let filtered = allProducts.slice();

        // Filtrar por categoría (compara con == para tolerar string/number)
        if (categoryId) {
            filtered = filtered.filter(p => p.categoria_id == categoryId);
        }

        // Filtrar por búsqueda (buscar por nombre y descripción)
        if (searchTerm) {
            filtered = filtered.filter(p => {
                const nombre = String(p.nombre || '').toLowerCase();
                const desc = String(p.descripcion || '').toLowerCase();
                return nombre.includes(searchTerm) || desc.includes(searchTerm);
            });
        }

        renderProducts(filtered);
    }

    function showNoResults(message = 'No se encontraron productos', isError = false) {
        // hide grid and pagination
        elements.productsGrid.style.display = 'none';
        elements.productsGrid.innerHTML = '';
        if (elements.paginationContainer) elements.paginationContainer.innerHTML = '';

        // set message and icon
        try {
            if (elements.noResultsText) elements.noResultsText.textContent = message;
            if (elements.noResultsIcon) {
                if (isError) {
                    elements.noResultsIcon.className = 'fas fa-exclamation-triangle text-6xl text-red-400 mb-4';
                } else {
                    elements.noResultsIcon.className = 'fas fa-search text-6xl text-gray-300 mb-4';
                }
            }
            if (elements.retryBtn) elements.retryBtn.style.display = isError ? 'inline-flex' : 'none';
        } catch (e) {}

        if (elements.noResults) elements.noResults.style.display = 'block';
    }

    function hideNoResults() {
        if (elements.noResults) elements.noResults.style.display = 'none';
        // ensure grid becomes visible when hiding the message
        if (elements.productsGrid) elements.productsGrid.style.display = 'grid';
    }

    function hideLoader() {
        try { elements.loader.style.display = 'none'; } catch (e) {}
        try { elements.productsGrid.style.display = 'grid'; } catch (e) {}
    }

    function renderPagination(totalItems){
        const container = elements.paginationContainer;
        if (!container) return;
        container.innerHTML = '';
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (totalPages <= 1) return;

        const createBtn = (label, page, disabled = false, active = false) => {
            return `<button data-page="${page}" class="px-3 py-1 rounded-md ${active ? 'bg-indigo-600 text-white' : 'bg-white border'}" ${disabled ? 'disabled' : ''}>${label}</button>`;
        };

        // Prev
        container.insertAdjacentHTML('beforeend', createBtn('‹', Math.max(1, currentPage -1), currentPage === 1));

        // Simple page window
        const windowSize = 5;
        let startPage = Math.max(1, currentPage - Math.floor(windowSize/2));
        let endPage = Math.min(totalPages, startPage + windowSize -1);
        if (endPage - startPage < windowSize -1){
            startPage = Math.max(1, endPage - windowSize +1);
        }

        for (let p = startPage; p <= endPage; p++){
            container.insertAdjacentHTML('beforeend', createBtn(p, p, false, p === currentPage));
        }

        // Next
        container.insertAdjacentHTML('beforeend', createBtn('›', Math.min(totalPages, currentPage +1), currentPage === totalPages));
    }

    function goToPage(page){
        if (!page || page < 1) return;
        currentPage = page;
        // re-run current filters/search to render the right page
        filterProducts();
        // scroll to top of products
        const topEl = elements.productsGrid;
        if (topEl) topEl.scrollIntoView({behavior:'smooth', block:'start'});
    }

    // Función global para ver detalles del producto
    window.viewProductDetail = function(productId) {
        window.location.href = `/proyecto-3er-trayecto/producto/${productId}`;
    };

    // Función global para contactar por producto
    window.contactForProduct = function(productName) {
        const message = encodeURIComponent(`Hola, me gustaría consultar sobre el producto: ${productName}`);
        const whatsappUrl = `https://wa.me/1234567890?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };
});
