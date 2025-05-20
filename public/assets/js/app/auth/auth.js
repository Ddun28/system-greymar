const Auth = {
    check: () => {
        try {
            const authData = localStorage.getItem('authData');
            return !!authData?.token;
        } catch (error) {
            console.error('Error de autenticación:', error);
            return false;
        }
    },
    
    require: () => {
        if (!Auth.check()) {
            sessionStorage.setItem('redirectPath', window.location.pathname);
            window.location.href = '/proyecto-3er-trayecto/login';
            return false;
        }
        return true;
    },
    
    getUser: () => {
        try {
            const authData = JSON.parse(localStorage.getItem('authData'));
            return authData?.user || null;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    },
    
    logout: () => {
        localStorage.removeItem('authData');
        window.location.href = '/proyecto-3er-trayecto/login';
    }
};

// Hacer disponible globalmente
window.Auth = Auth;

// Iniciar Router
const router = new Router();
window.router = router;