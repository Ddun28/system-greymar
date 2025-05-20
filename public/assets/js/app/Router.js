class Router {
    constructor() {
        this.basePath = '/proyecto-3er-trayecto';
        this.routes = {
            '/': {
                view: `${this.basePath}/views/index.html`,
            },
            '/login': {
                view: `${this.basePath}/views/auth/index.html`,
                script: `${this.basePath}/public/assets/js/app/auth/login.js`
            },
            '/admin': {
                view: `${this.basePath}/views/admin/index.html`,
                script: `${this.basePath}/public/assets/js/app/admin/index.js`,
                protected: true
            },
            '/admin/users': {
                view: `${this.basePath}/views/admin/users/index.html`,
                script: `${this.basePath}/public/assets/js/app/admin/users.js`,
                protected: true
            },
            '/admin/category': {
                view: `${this.basePath}/views/admin/category/index.html`,
                script: `${this.basePath}/public/assets/js/app/admin/category.js`,
                protected: true
            },
            '/admin/product': {
                view: `${this.basePath}/views/admin/product/index.html`,
                script: `${this.basePath}/public/assets/js/app/admin/product.js`,
                protected: true
            },
        };
        this.init();
    }

    init() {
        window.addEventListener('popstate', () => this.handleRouting());
        document.addEventListener('DOMContentLoaded', () => this.handleRouting());
        document.addEventListener('click', e => this.handleLinks(e));
    }

    handleLinks(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            this.navigate(e.target.href);
        }
    }

    navigate(url) {
        const path = url.replace(window.location.origin, '');
        window.history.pushState({}, '', path);
        this.handleRouting();
    }

    async handleRouting() {
        const path = window.location.pathname.replace(this.basePath, '') || '/';
        const route = this.routes[path] || this.routes['/'];
        
        try {
            // Cargar vista primero
            const response = await fetch(route.view);
            if (!response.ok) throw new Error('Vista no encontrada');
            document.getElementById('app').innerHTML = await response.text();
            
            // Cargar auth.js para rutas protegidas
            if (route.protected) {
                await this.loadScript(`${this.basePath}/public/assets/js/app/auth.js`);
            }
            
            // Cargar script específico si existe
            if (route.script) {
                await this.loadScript(route.script);
            }
            
            this.initComponents();
            
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('app').innerHTML = '<h1>404 - Página no encontrada</h1>';
        }
    }

    loadScript(scriptUrl) {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
            if (existingScript) existingScript.remove();
            
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.onload = () => resolve();
            script.onerror = (error) => reject(error);
            document.body.appendChild(script);
        });
    }

    initComponents() {
        if (typeof AOS !== 'undefined') AOS.init();
        if (typeof initPage !== 'undefined') initPage();
    }
}