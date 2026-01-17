document.addEventListener('DOMContentLoaded', async () => {
    AOS.init({
        once: true,
        duration: 800
    });

    const productId = getProductIdFromUrl();
    
    if (!productId) {
        showError();
        return;
    }

    await loadProductDetail(productId);
});

function getProductIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    const productIndex = pathParts.indexOf('producto');
    return productIndex !== -1 && pathParts[productIndex + 1] 
        ? pathParts[productIndex + 1] 
        : null;
}

async function loadProductDetail(productId) {
    const apiBaseUrl = '/proyecto-3er-trayecto/products';
    const categoriesUrl = '/proyecto-3er-trayecto/categories';
    
    try {
        // Cargar producto y categorías en paralelo
        const [productResponse, categoriesResponse] = await Promise.all([
            fetch(`${apiBaseUrl}/${productId}`),
            fetch(categoriesUrl)
        ]);

        const productResult = await productResponse.json();
        const categoriesResult = await categoriesResponse.json();

            let exchangeRate = null;
            try {
                const raw = localStorage.getItem('exchangeRateData');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && parsed.rate && parsed.fetchedAt && (Date.now() - parsed.fetchedAt) < 24 * 60 * 60 * 1000) {
                        exchangeRate = parseFloat(parsed.rate) || null;
                    }
                }
            } catch (e) {
                console.warn('Error leyendo cache de tasa (detail):', e);
                exchangeRate = null;
            }

        if (productResult.status === 'success' && productResult.data) {
            const product = productResult.data;
            const categories = categoriesResult.status === 'success' ? categoriesResult.data : [];
            
            renderProductDetail(product, categories);
            renderProductPrice(product, exchangeRate);
            // Escuchar actualizaciones forzadas de la tasa para actualizar precio
            window.addEventListener('exchangeRateUpdated', (ev) => {
                const newRate = ev && ev.detail && ev.detail.rate ? ev.detail.rate : null;
                renderProductPrice(product, newRate);
            }, { once: false });
            await loadRelatedProducts(product.categoria_id, productId, categories);
            
            hideLoader();
        } else {
            showError();
        }
    } catch (error) {
        console.error('Error al cargar producto:', error);
        showError();
    }
}

function renderProductPrice(product, exchangeRate) {
    const priceVal = parseFloat(product.precio ?? product.precio_venta ?? 0) || 0;
    const priceBs = exchangeRate ? (priceVal * exchangeRate).toFixed(2) : null;
    const el = document.getElementById('productPrice');
    if (!el) return;
    el.innerHTML = priceBs ? `$${priceVal.toFixed(2)} <span class="text-sm text-gray-500">(Bs. ${priceBs})</span>` : `$${priceVal.toFixed(2)}`;
}

function renderProductDetail(product, categories) {
    const category = categories.find(c => c.id == product.categoria_id);
    const categoryName = category ? category.nombre : 'Sin categoría';

    // Imagen del producto
    const imageContainer = document.getElementById('productImageContainer');
    if (product.imagen) {
        imageContainer.innerHTML = `
            <img src="${product.imagen}" 
                 class="w-full h-full object-cover" 
                 alt="${product.nombre}"
                 onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image text-6xl text-gray-300\\'></i>'">
        `;
    }

    // Badge de stock
    const stockBadge = document.getElementById('stockBadge');
    if (product.stock > 0) {
        stockBadge.innerHTML = `
            <span class="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2">
                <i class="fas fa-check-circle"></i> Disponible
            </span>
        `;
    } else {
        stockBadge.innerHTML = `
            <span class="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2">
                <i class="fas fa-times-circle"></i> Agotado
            </span>
        `;
    }

    // Badge de categoría
    document.getElementById('categoryBadge').innerHTML = `
        <span class="inline-block px-4 py-2 bg-primary/10 text-primary font-semibold rounded-full">
            ${categoryName}
        </span>
    `;

    // Información del producto
    document.getElementById('productName').textContent = product.nombre;
    document.getElementById('productDescription').textContent = product.descripcion || 'Sin descripción disponible.';
    
    // Stock info
    const stockClass = product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600';
    document.getElementById('stockInfo').innerHTML = `
        <span class="${stockClass}">${product.stock} unidades</span>
    `;

    // Stock status
    let statusText = '';
    let statusClass = '';
    if (product.stock > 10) {
        statusText = 'Alta disponibilidad';
        statusClass = 'text-green-600';
    } else if (product.stock > 0) {
        statusText = 'Stock limitado';
        statusClass = 'text-yellow-600';
    } else {
        statusText = 'Sin stock';
        statusClass = 'text-red-600';
    }
    document.getElementById('stockStatus').innerHTML = `
        <p class="text-sm font-medium ${statusClass}">${statusText}</p>
    `;

    // Detalles adicionales
    document.getElementById('productCategory').textContent = categoryName;
    document.getElementById('productState').textContent = product.stock > 0 ? 'Activo' : 'Sin stock';

    // Guardar nombre del producto para las funciones globales
    window.currentProduct = product;
}

async function loadRelatedProducts(categoryId, currentProductId, categories) {
    const apiBaseUrl = '/proyecto-3er-trayecto/products';
    
    try {
        const response = await fetch(apiBaseUrl);
        const result = await response.json();
        
        if (result.status === 'success') {
            // Filtrar productos de la misma categoría, excluyendo el actual
            const relatedProducts = result.data
                .filter(p => p.categoria_id == categoryId && p.id != currentProductId)
                .slice(0, 5);
            
            renderRelatedProducts(relatedProducts, categories);
        }
    } catch (error) {
        console.error('Error al cargar productos relacionados:', error);
    }
}

function renderRelatedProducts(products, categories) {
    const container = document.getElementById('relatedProducts');
    
    if (products.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No hay productos relacionados</p>';
        return;
    }

    container.innerHTML = products.map((product, index) => {
        const category = categories.find(c => c.id == product.categoria_id);
        const categoryName = category ? category.nombre : 'Sin categoría';
        
        return `
            <div class="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-all duration-200 hover:shadow-lg group cursor-pointer"
                 data-aos="fade-up" data-aos-delay="${index * 50}"
                 onclick="window.location.href='/proyecto-3er-trayecto/producto/${product.id}'">
                <div class="relative h-40 bg-gray-100 overflow-hidden">
                    ${product.imagen ? 
                        `<img src="${product.imagen}" 
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                             alt="${product.nombre}"
                             onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-gray-50\\'><i class=\\'fas fa-image text-2xl text-gray-300\\'></i></div>'">` : 
                        `<div class="w-full h-full flex items-center justify-center bg-gray-50">
                            <i class="fas fa-image text-2xl text-gray-300"></i>
                         </div>`
                    }
                    ${product.stock > 0 ? 
                        `<div class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                            <i class="fas fa-check"></i>
                         </div>` : 
                        `<div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                            <i class="fas fa-times"></i>
                         </div>`
                    }
                </div>
                <div class="p-3">
                    <span class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded mb-2">
                        ${categoryName}
                    </span>
                    <h4 class="text-sm font-semibold text-gray-800 line-clamp-1">${product.nombre}</h4>
                    <p class="text-xs text-gray-500 mt-1">Stock: ${product.stock}</p>
                </div>
            </div>
        `;
    }).join('');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('productContent').classList.remove('hidden');
}

function showError() {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('errorContent').classList.remove('hidden');
}

// Funciones globales
window.contactForProduct = function() {
    if (!window.currentProduct) return;
    
    const message = encodeURIComponent(`Hola, me gustaría consultar sobre el producto: ${window.currentProduct.nombre}`);
    const whatsappUrl = `https://wa.me/1234567890?text=${message}`;
    window.open(whatsappUrl, '_blank');
};

window.shareProduct = function() {
    if (!window.currentProduct) return;
    
    const shareData = {
        title: window.currentProduct.nombre,
        text: `Mira este producto: ${window.currentProduct.nombre}`,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(err => console.log('Error al compartir:', err));
    } else {
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Enlace copiado al portapapeles');
        });
    }
};
