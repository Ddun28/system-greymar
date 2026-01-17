document.addEventListener('DOMContentLoaded', () => {

    const authData = localStorage.getItem('authData');
    if( !authData){
        window.location.href = '/proyecto-3er-trayecto/login';
    }

    const apiBaseUrl = '/proyecto-3er-trayecto';
    let stockChartInstance = null;
    let categoryChartInstance = null;
    let exchangeRate = null; // Bs por USD (promedio)

    // Cache de tasa en localStorage (TTL 24h)
    async function getCachedExchangeRate() {
        const key = 'exchangeRateData';
        try {
            const raw = localStorage.getItem(key);
            const now = Date.now();
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.rate && parsed.fetchedAt && (now - parsed.fetchedAt) < 24 * 60 * 60 * 1000) {
                    return parsed; // { rate, fetchedAt, raw }
                }
            }
        } catch (e) {
            console.warn('Error leyendo cache de tasa:', e);
        }

        // Si no hay cache válida, obtener de la API
        try {
            const resp = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
            const json = await resp.json();
            const rate = json && parseFloat(json.promedio) || null;
            const data = { rate, fetchedAt: Date.now(), raw: json };
            try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore storage errors */ }
            return data;
        } catch (e) {
            console.warn('No se pudo obtener tasa desde API:', e);
            return { rate: null, fetchedAt: null, raw: null };
        }
    }

    // Elementos del DOM
    const elements = {
        totalProducts: document.querySelector('[data-stat="total-products"]'),
        totalCategories: document.querySelector('[data-stat="total-categories"]'),
        lowStockCount: document.querySelector('[data-stat="low-stock"]'),
        productsList: document.querySelector('#products-list'),
        categoriesGrid: document.querySelector('#categories-grid'),
        recentMovements: document.querySelector('#recent-movements')
    };

    document.querySelector('#generatePdf')?.addEventListener('click', generateInventoryReport);

   async function generateInventoryReport() {
       try {
           const jsPDF = window.jspdf.jsPDF;
           const doc = new jsPDF('landscape');

           // Obtener todos los productos
           const productsResponse = await fetch(`${apiBaseUrl}/products`);
           const productsData = await productsResponse.json();
           const allProducts = productsData.data;

           // Totales generales
           const totalProductsCount = Array.isArray(allProducts) ? allProducts.length : 0;
           const totalStockUnits = Array.isArray(allProducts) ? allProducts.reduce((s, p) => s + (parseFloat(p.stock) || 0), 0) : 0;
           const totalValueUSD = Array.isArray(allProducts) ? allProducts.reduce((s, p) => {
               const price = parseFloat(p.precio ?? p.precio_venta ?? 0) || 0;
               const stock = parseFloat(p.stock) || 0;
               return s + (price * stock);
           }, 0) : 0;
           const totalValueBs = exchangeRate ? (totalValueUSD * exchangeRate) : null;

           // Configuración inicial
           doc.setFontSize(18);
           doc.text('Reporte de Inventario Completo', 15, 20);
           doc.setFontSize(12);
           doc.setTextColor(100);
           
           let yPosition = 30;

           // Totales generales en la cabecera
           doc.setFontSize(11);
           doc.text(`Totales: Productos: ${totalProductsCount}    Stock total: ${totalStockUnits}`, 15, yPosition);
           yPosition += 6;
           doc.text(`Valor inventario: $${totalValueUSD.toFixed(2)}${totalValueBs ? ` (Bs. ${totalValueBs.toFixed(2)})` : ''}`, 15, yPosition);
           yPosition += 10;

           // Tabla de Productos Completa
           doc.setFontSize(14);
           doc.text('Listado Completo de Productos:', 15, yPosition);
           yPosition += 10;
           
           const headers = [["Nombre", "Categoría", "Precio", "Stock"]];
           const rows = allProducts.map(p => {
               const priceNum = parseFloat(p.precio ?? p.precio_venta ?? 0) || 0;
               const priceBs = exchangeRate ? (priceNum * exchangeRate).toFixed(2) : null;
               const priceDisplay = priceBs ? `$${priceNum.toFixed(2)} (Bs. ${priceBs})` : `$${priceNum.toFixed(2)}`;
               return [
                   p.nombre,
                   p.categoria || 'Sin categoría',
                   priceDisplay,
                   (p.stock ?? 0).toString()
               ];
           });
           
            doc.autoTable({
               startY: yPosition,
               head: headers,
               body: rows,
               theme: 'grid',
               styles: { fontSize: 10 },
               headStyles: { fillColor: [41, 128, 185] }
           });
           
           // Guardar PDF
           doc.save(`reporte-inventario-${new Date().toISOString().split('T')[0]}.pdf`);

       } catch (error) {
           console.error('Error generando PDF:', error);
           showNotification('Error al generar el reporte', 'error');
       }
   }
   

    // Inicialización
    init();

    async function init() {
        await loadDashboardData();
        setupEventListeners();
    }

    async function loadDashboardData() {
        try {
            const [products, categories, movements] = await Promise.all([
                fetch(`${apiBaseUrl}/products`).then(res => res.json()),
                fetch(`${apiBaseUrl}/categories`).then(res => res.json()),
                fetch(`${apiBaseUrl}/movimientos?limit=5`).then(res => res.json())
            ]);

            const rateObj = await getCachedExchangeRate();
            exchangeRate = rateObj && (parseFloat(rateObj.rate) || null);
            const rateRes = rateObj && rateObj.raw ? rateObj.raw : null;
            // Mostrar tasa en el encabezado si existe (badge estilizado)
            const badge = document.getElementById('exchangeBadge');
            const valueEl = document.getElementById('exchangeValue');
            const updatedEl = document.getElementById('exchangeUpdated');
            if (badge && valueEl) {
                if (exchangeRate) {
                    valueEl.textContent = `${exchangeRate.toFixed(2)} Bs / USD`;
                    // fecha de actualización si viene
                    if (rateRes && rateRes.fechaActualizacion) {
                        try {
                            const d = new Date(rateRes.fechaActualizacion);
                            updatedEl.textContent = `Actualizado ${d.toLocaleString()}`;
                        } catch (e) {
                            updatedEl.textContent = '';
                        }
                    } else {
                        updatedEl.textContent = '';
                    }
                    badge.classList.remove('hidden');
                    badge.setAttribute('title', `Fuente: ${rateRes?.fuente || 'oficial'}`);
                } else {
                    badge.classList.add('hidden');
                    valueEl.textContent = '';
                    updatedEl.textContent = '';
                }
            }

            if (products.status === 'success' && 
                categories.status === 'success' && 
                movements.status === 'success') {
                
                updateQuickStats(products.data, categories.data);
                renderStockChart(products.data, categories.data);
                renderCategoryChart(products.data, categories.data);
                renderRecentProducts(products.data);
                renderCategories(categories.data, products.data);
                renderRecentMovements(movements.data);
            }
        } catch (error) {
            showNotification('Error al cargar datos del dashboard', 'error');
        }
    }

    // Forzar actualización manual de la tasa: limpiar cache y re-fetch
    document.getElementById('refreshExchangeBtn')?.addEventListener('click', async () => {
        try {
            // eliminar cache y reobtener
            localStorage.removeItem('exchangeRateData');
            const rateObj = await getCachedExchangeRate();
            exchangeRate = rateObj && (parseFloat(rateObj.rate) || null);

            const badge = document.getElementById('exchangeBadge');
            const valueEl = document.getElementById('exchangeValue');
            const updatedEl = document.getElementById('exchangeUpdated');
            if (exchangeRate) {
                valueEl.textContent = `${exchangeRate.toFixed(2)} Bs / USD`;
                if (rateObj && rateObj.fetchedAt) {
                    try { const d = new Date(rateObj.fetchedAt); updatedEl.textContent = `Actualizado ${d.toLocaleString()}`; } catch(e){ updatedEl.textContent = ''; }
                }
                badge.classList.remove('hidden');
                badge.setAttribute('title', `Fuente: ${rateObj?.raw?.fuente || 'oficial'}`);
            } else {
                badge.classList.add('hidden');
                if (valueEl) valueEl.textContent = '';
                if (updatedEl) updatedEl.textContent = '';
            }

            // Propagar evento para que otros módulos actualicen sus vistas
            window.dispatchEvent(new CustomEvent('exchangeRateUpdated', { detail: { rate: exchangeRate } }));
            showNotification('Tasa de cambio actualizada', 'success');
        } catch (e) {
            console.error('Error al actualizar tasa:', e);
            showNotification('Error actualizando la tasa', 'error');
        }
    });

    function updateQuickStats(products, categories) {
        // Productos totales
        elements.totalProducts.textContent = products.length;
        
        // Categorías totales
        elements.totalCategories.textContent = categories.length;
        
        // Stock bajo (productos donde stock <= stock_minimo)
        const lowStock = products.filter(p => p.stock <= (p.stock_minimo || 5)).length;
        elements.lowStockCount.textContent = lowStock;
        
        // Cambiar color si hay stock bajo
        if (lowStock > 0) {
            elements.lowStockCount.classList.add('animate-pulse');
        }
    }

    function renderStockChart(products, categories = []) {
        // Destruir gráfico anterior si existe
        if (stockChartInstance) stockChartInstance.destroy();

        const ctx = document.getElementById('stockChart').getContext('2d');

        // Agrupar stock por categoría
        const stockByCategory = products.reduce((acc, product) => {
            acc[product.categoria_id] = (acc[product.categoria_id] || 0) + product.stock;
            return acc;
        }, {});

        // Mapea ids a nombres de categoría cuando sea posible
        const categoryNameById = (categories || []).reduce((acc, c) => { acc[c.id] = c.nombre; return acc; }, {});

        // Mantener el orden de las categorías (ids) para mapear en tooltip
        const categoryIds = Object.keys(stockByCategory);
        const labels = categoryIds.map(id => categoryNameById[id] || `Categoría ${id}`);
        const data = categoryIds.map(id => stockByCategory[id]);

        // Preparar lista de productos por categoría para el tooltip
        const productsByCategory = {};
        categoryIds.forEach(id => {
            productsByCategory[id] = products
                .filter(p => String(p.categoria_id) === String(id))
                .map(p => `${p.nombre} — ${p.stock}`);
        });

        stockChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Stock Total',
                    data,
                    backgroundColor: '#3B82F680',
                    borderColor: '#3B82F6',
                    borderWidth: 1
                }]
            },
            options: Object.assign({}, getChartOptions('Stock por Categoría'), {
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (items) => items && items.length ? items[0].label : '',
                            label: (ctx) => `Stock Total: ${ctx.formattedValue}`,
                            afterBody: (items) => {
                                const idx = items && items.length ? items[0].dataIndex : null;
                                if (idx === null) return [];
                                const catId = categoryIds[idx];
                                const prods = productsByCategory[catId] || [];
                                return prods.length ? [''] .concat(prods) : ['','No hay productos'];
                            }
                        }
                    }
                }
            })
        });
    }

    function renderCategoryChart(products, categories) {
        // Ahora muestra distribución por producto (por stock) en lugar de por categoría
        if (categoryChartInstance) categoryChartInstance.destroy();

        const ctx = document.getElementById('categoryChart').getContext('2d');

        const prods = Array.isArray(products) ? products.slice() : [];
        if (prods.length === 0) {
            // render vacío
            categoryChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: ['Sin productos'], datasets: [{ data: [1], backgroundColor: ['#9CA3AF'] }] },
                options: getChartOptions('Distribución por Productos (stock)')
            });
            return;
        }

        // Usar stock como métrica de distribución; si no hay stock, usar 1 para representar el producto
        const normalized = prods.map(p => ({
            label: p.nombre || `Producto ${p.id}`,
            value: Math.max(0, Number(p.stock) || 0)
        }));

        // Si todos los valores son 0, mostrar 1 por producto para una distribución uniforme
        const allZero = normalized.every(n => n.value === 0);
        const items = allZero ? normalized.map(n => ({ label: n.label, value: 1 })) : normalized;

        // Limitar a top 12 por valor para evitar demasiadas secciones
        items.sort((a, b) => b.value - a.value);
        const top = items.slice(0, 12);

        const labels = top.map(t => t.label);
        const data = top.map(t => t.value);

        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6',
            '#F97316', '#06B6D4', '#7C3AED', '#DB2777'
        ];

        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0
                }]
            },
            options: Object.assign({}, getChartOptions('Distribución por Productos (stock)'), {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Productos: ${ctx.formattedValue}`,
                            afterLabel: (ctx) => {
                                const idx = ctx.dataIndex;
                                const cat = prods.find(p => String(p.nombre) === String(labels[idx]));
                                return cat ? `Categoría: ${cat.categoria || cat.categoria_id || '—'}` : '';
                            }
                        }
                    }
                }
            })
        });
    }

    function renderRecentProducts(products) {

    // Verifica si hay productos
    if (!Array.isArray(products) || products.length === 0) {
        console.warn("No hay productos para mostrar."); // Log de advertencia si no hay productos
        elements.productsList.innerHTML = '<tr><td colspan="5" class="text-center">No hay productos disponibles.</td></tr>';
        return;
    }

    const recentProducts = products.slice(-5).reverse();

    elements.productsList.innerHTML = recentProducts.map(product => {
        const minStock = product.stock_minimo || 5;
        const isLowStock = product.stock <= minStock;
        const priceNum = parseFloat(product.precio ?? product.precio_venta ?? 0) || 0;
        const priceBs = exchangeRate ? (priceNum * exchangeRate).toFixed(2) : null;
        const priceHtml = `$${priceNum.toFixed(2)}${priceBs ? ` <span class="text-xs text-gray-400">(Bs. ${priceBs})</span>` : ''}`;

        return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isLowStock ? 'bg-red-50 dark:bg-red-900/10' : ''}">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    ${product.imagen ? 
                        `<img src="${product.imagen}" 
                            class="w-10 h-10 object-cover rounded-lg mr-3 border dark:border-gray-600"
                            alt="${product.nombre}">` : 
                        '<div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3"></div>'}
                    <span class="text-sm dark:text-gray-300 font-medium">${product.nombre}</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-400">
                ${product.categoria || 'Sin categoría'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">
                ${priceHtml}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full ${getStockColor(product.stock, minStock)}" 
                            style="width: ${Math.min(product.stock, 100)}%"></div>
                    </div>
                    <span class="ml-2 text-sm ${isLowStock ? 'text-red-600 dark:text-red-400 font-semibold' : 'dark:text-gray-400'}">
                        ${product.stock}
                        ${isLowStock ? '<i class="fas fa-exclamation-triangle text-yellow-500 ml-1"></i>' : ''}
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-blue-600 hover:underline"
                    onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:underline ml-3"
                    onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;}).join('');
}


    function renderCategories(categories, products) { // Agregar parámetro products
        elements.categoriesGrid.innerHTML = categories.map(category => {
            const prods = (products || []).filter(p => p.categoria_id === category.id);
            const count = prods.length;

            const productsHtml = count === 0 ?
                `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">No hay productos</p>` :
                `<ul class="mt-2 space-y-2 max-h-40 overflow-auto">
                    ${prods.map(p => `
                        <li class="flex items-center justify-between text-sm">
                            <span class="truncate max-w-[160px] text-gray-700 dark:text-gray-300">${p.nombre}</span>
                            <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStockPillClass(p.stock, p.stock_minimo)}">
                                ${p.stock}
                            </span>
                        </li>
                    `).join('')}
                </ul>`;

            return `
                <div class="p-4 rounded-lg bg-gradient-to-br ${getCategoryColor(category.id)} border ${getCategoryBorder(category.id)}">
                    <p class="font-medium dark:text-gray-300">${category.nombre}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${count} productos</p>
                    ${productsHtml}
                </div>
            `;
        }).join('');
    }

    function getStockPillClass(stock, minStock = 5) {
        if (stock === 0) return 'bg-red-600 text-white';
        if (stock <= (minStock || 5)) return 'bg-yellow-400 text-black';
        return 'bg-green-500 text-white';
    }

    function renderRecentMovements(movements) {
    elements.recentMovements.innerHTML = movements.map(movement => `
        <div class="...">
            <div>
                <p class="dark:text-white">
                    ${movement.tipo === 'entrada' ? 'Entrada' : 'Salida'} de Stock
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    ${movement.producto_nombre || 'Producto no encontrado'} 
                    (${movement.tipo === 'entrada' ? '+' : '-'}${movement.cantidad})
                </p>
            </div>
            <span class="dark:text-white">
                ${new Date(movement.created_at).toLocaleDateString()}
            </span>
        </div>
    `).join('');
}

    // Funciones auxiliares
    function getChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    labels: { 
                        color: '#6B7280',
                        font: { family: 'Inter' } 
                    } 
                },
                title: {
                    display: true,
                    text: title,
                    color: '#6B7280',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    grid: { color: '#E5E7EB20' },
                    ticks: { color: '#6B7280' }
                },
                x: {
                    grid: { color: '#E5E7EB20' },
                    ticks: { color: '#6B7280' }
                }
            }
        };
    }

    function getStockColor(stock, minStock = 5) {
        if (stock === 0) return 'bg-red-500 dark:bg-red-600';
        if (stock <= minStock) return 'bg-yellow-500 dark:bg-yellow-600';
        if (stock > 50) return 'bg-green-500 dark:bg-green-600';
        return 'bg-blue-500 dark:bg-blue-600';
    }

    function getCategoryColor(id) {
        const colors = [
            'from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30',
            'from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/30',
            'from-purple-100 to-purple-50 dark:from-purple-900/50 dark:to-purple-800/30',
            'from-orange-100 to-orange-50 dark:from-orange-900/50 dark:to-orange-800/30'
        ];
        return colors[id % colors.length];
    }

    function getCategoryBorder(id) {
        const borders = [
            'border-blue-200 dark:border-blue-800',
            'border-green-200 dark:border-green-800',
            'border-purple-200 dark:border-purple-800',
            'border-orange-200 dark:border-orange-800'
        ];
        return borders[id % borders.length];
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

    function setupEventListeners() {
        // Actualizar datos cada 5 minutos
        setInterval(loadDashboardData, 300000);
        
        // Botón nuevo producto
        document.querySelector('#new-product-btn').addEventListener('click', () => {
            window.location.href = '/proyecto-3er-trayecto/admin/product';
        });
    }

    // Funciones globales
    window.editProduct = (id) => { /* Lógica de edición */ };
    window.deleteProduct = (id) => { /* Lógica de eliminación */ };
});