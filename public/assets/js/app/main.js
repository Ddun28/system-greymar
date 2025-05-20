import { Router } from './Router.js';

// Configuración inicial
const router = new Router();

// Registrar rutas
router.addRoute('/login', 'auth/login', () => {
    import('./controllers/AuthController.js')
        .then(module => module.initLoginForm());
});

router.addRoute('/admin', 'admin/dashboard', () => {
    import('./controllers/AdminController.js')
        .then(module => module.initDashboard());
});

// Middleware global de autenticación
router.addRouteMiddleware(/^\/admin.*/, async () => {
    const authData = JSON.parse(localStorage.getItem('authData'));
    
    if (!authData?.token) {
        router.navigateTo('/login');
        return false;
    }
    
    try {
        const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${authData.token}` }
        });
        
        if (!response.ok) throw new Error();
        return true;
    } catch (error) {
        router.navigateTo('/login');
        return false;
    }
});

export { router };