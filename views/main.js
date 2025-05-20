import { router } from './routers/MainRouter.js';

// Configurar rutas
router.addRoute('/', 'home', () => {
    console.log('Página principal cargada');
});

router.addRoute('/productos', 'productos/list', () => {
    // Cargar datos de productos
    fetch('/api/products')
        .then(response => response.json())
        .then(data => renderProducts(data.products));
});

router.addRoute('/productos/:id', 'productos/detail', (params) => {
    const productId = params[0];
    fetch(`/api/products/${productId}`)
        .then(response => response.json())
        .then(data => renderProductDetail(data));
});

router.addRoute('*', 'error404', () => {
    console.log('Página no encontrada');
});

// Inicializar router
document.addEventListener('DOMContentLoaded', () => {
    router.navigate();
});