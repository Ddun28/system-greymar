document.addEventListener('DOMContentLoaded', () => {

    const authData = localStorage.getItem('authData');
    if( !authData){
        window.location.href = '/proyecto-3er-trayecto/login';
    }

    const apiBaseUrl = '/proyecto-3er-trayecto';
    let stockChartInstance = null;
    let categoryChartInstance = null;

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

           // Configuración inicial
           doc.setFontSize(18);
           doc.text('Reporte de Inventario Completo', 15, 20);
           doc.setFontSize(12);
           doc.setTextColor(100);
           
           let yPosition = 30;

           // Tabla de Productos Completa
           doc.setFontSize(14);
           doc.text('Listado Completo de Productos:', 15, yPosition);
           yPosition += 10;
           
           const headers = [["Nombre", "Categoría", "Precio", "Stock"]];
           const rows = allProducts.map(p => [
               p.nombre,
               p.categoria || 'Sin categoría',
               `$${p.precio_venta?.toFixed(2) || '0.00'}`,
               p.stock.toString()
           ]);
           
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

            if (products.status === 'success' && 
                categories.status === 'success' && 
                movements.status === 'success') {
                
                updateQuickStats(products.data, categories.data);
                renderStockChart(products.data);
                renderCategoryChart(products.data, categories.data);
                renderRecentProducts(products.data);
                renderCategories(categories.data, products.data);
                renderRecentMovements(movements.data);
            }
        } catch (error) {
            showNotification('Error al cargar datos del dashboard', 'error');
        }
    }

    function updateQuickStats(products, categories) {
        // Productos totales
        elements.totalProducts.textContent = products.length;
        
        // Categorías totales
        elements.totalCategories.textContent = categories.length;
        
        // Stock bajo (menos de 10 unidades)
        const lowStock = products.filter(p => p.stock < 10).length;
        elements.lowStockCount.textContent = lowStock;
    }

    function renderStockChart(products) {
        // Destruir gráfico anterior si existe
        if (stockChartInstance) stockChartInstance.destroy();

        const ctx = document.getElementById('stockChart').getContext('2d');
        
        // Agrupar stock por categoría
        const stockByCategory = products.reduce((acc, product) => {
            acc[product.categoria_id] = (acc[product.categoria_id] || 0) + product.stock;
            return acc;
        }, {});

        stockChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(stockByCategory).map(id => `Categoría ${id}`),
                datasets: [{
                    label: 'Stock Total',
                    data: Object.values(stockByCategory),
                    backgroundColor: '#3B82F680',
                    borderColor: '#3B82F6',
                    borderWidth: 1
                }]
            },
            options: getChartOptions('Stock por Categoría')
        });
    }

    function renderCategoryChart(products, categories) {
        if (categoryChartInstance) categoryChartInstance.destroy();

        const ctx = document.getElementById('categoryChart').getContext('2d');
        const categoryCounts = categories.map(cat => 
            products.filter(p => p.categoria_id === cat.id).length
        );

        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => cat.nombre),
                datasets: [{
                    data: categoryCounts,
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#6366F1',
                        '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6'
                    ],
                    borderWidth: 0
                }]
            },
            options: getChartOptions('Distribución por Categorías')
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

    elements.productsList.innerHTML = recentProducts.map(product => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                $${product.precio_venta?.toFixed(2) || '0.00'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full ${getStockColor(product.stock)}" 
                            style="width: ${Math.min(product.stock, 100)}%"></div>
                    </div>
                    <span class="ml-2 text-sm dark:text-gray-400">${product.stock}</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex space-x-3">
                    <button class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}


    function renderCategories(categories, products) { // Agregar parámetro products
    // Calcular conteo de productos por categoría
    const categoryCounts = categories.reduce((acc, category) => {
        acc[category.id] = products.filter(p => p.categoria_id === category.id).length; // Quitar .data
        return acc;
    }, {});

    elements.categoriesGrid.innerHTML = categories.map(category => `
        <div class="p-4 rounded-lg bg-gradient-to-br ${getCategoryColor(category.id)} border ${getCategoryBorder(category.id)}">
            <p class="font-medium dark:text-gray-300">${category.nombre}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                ${categoryCounts[category.id] || 0} productos
            </p>
        </div>
    `).join('');
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

    function getStockColor(stock) {
        if (stock > 50) return 'bg-green-500 dark:bg-green-600';
        if (stock > 20) return 'bg-yellow-500 dark:bg-yellow-600';
        return 'bg-red-500 dark:bg-red-600';
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