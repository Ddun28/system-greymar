const createSidebar = () => {
    const sidebarContainer = document.querySelector('#sidebar');
    const authData = JSON.parse(localStorage.getItem('authData'));
    const currentPath = window.location.pathname.replace('/proyecto-3er-trayecto', '');
    const username = authData?.user?.username || "Invitado"; 
    
    sidebarContainer.innerHTML = `
    <!-- Navbar Superior -->
    <div class="fixed top-0 dark:border-gray-700 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-md z-50 flex items-center justify-between px-4 md:px-6">
        <!-- Menú Hamburger (Mobile) -->
        <button id="mobileMenuButton" class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg id="menuIcon" class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg id="closeIcon" class="w-6 h-6 hidden text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>

        <!-- Bienvenida -->
        <div class="hidden md:block">
            <h1 class="text-lg font-semibold text-gray-700 dark:text-gray-200">Bienvenido, ${username}</h1>
        </div>

        <!-- Contenedor Derecha -->
        <div class="flex items-center gap-4">
            <!-- Campanita de Alertas Stock -->
            <div class="relative">
                <button id="alertsToggle" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                    <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                    <span id="alertsBadge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">0</span>
                </button>
                
                <!-- Dropdown de Alertas -->
                <div id="alertsDropdown" class="hidden absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div class="p-3 border-b dark:border-gray-700">
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200">
                            <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                            Alertas de Stock
                        </h4>
                    </div>
                    <div id="alertsList" class="divide-y dark:divide-gray-700">
                        <!-- Alertas se cargarán dinámicamente -->
                    </div>
                </div>
            </div>

            <!-- Dark Mode Toggle -->
            <button id="themeToggle" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg id="sunIcon" class="w-6 h-6 text-yellow-500 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
                </svg>
                <svg id="moonIcon" class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
            </button>

            <!-- Botón Cerrar Sesión Desktop -->
            <button id="logoutButton" class="hidden md:flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Cerrar Sesión
            </button>
        </div>
    </div>

    <!-- Sidebar -->
    <aside class="sidebar-content bg-white dark:bg-gray-800 w-64 shadow-xl fixed h-full -translate-x-full md:translate-x-0 transition-transform duration-300 z-40 pt-16 md:pt-0">
        <div class="p-6">
            <a href="/proyecto-3er-trayecto/admin" class="inline-block">
                <img src="/proyecto-3er-trayecto/image/logo-greymar.jpg" alt="Greymar" class="h-10 object-contain">
            </a>
        </div>
        
        <nav class="mt-6">
            <!-- Inicio -->
            <a href="/proyecto-3er-trayecto/admin" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${currentPath === '/admin' ? 'bg-gray-200 dark:bg-gray-700' : ''}">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Inicio
            </a>

            <!-- Usuarios -->
            <a href="/proyecto-3er-trayecto/admin/users" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${currentPath === '/admin/users' ? 'bg-gray-200 dark:bg-gray-700' : ''}">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Usuarios
            </a>

            <!-- Categorías -->
            <a href="/proyecto-3er-trayecto/admin/category" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${currentPath === '/admin/category' ? 'bg-gray-200 dark:bg-gray-700' : ''}">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
                Categoria
            </a>

            <!-- Productos -->
            <a href="/proyecto-3er-trayecto/admin/product" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${currentPath === '/admin/product' ? 'bg-gray-200 dark:bg-gray-700' : ''}">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                Productos
            </a>

            <a href="/proyecto-3er-trayecto/admin/movements" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${currentPath === '/admin/movements' ? 'bg-gray-200 dark:bg-gray-700' : ''}">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
                Movimientos
            </a>

            <!-- Auditoría -->
            <a href="/proyecto-3er-trayecto/admin/audit" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${currentPath === '/admin/audit' ? 'bg-gray-200 dark:bg-gray-700' : ''}">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
                Auditoría
            </a>

            <!-- Cerrar Sesión Mobile -->
            <a href="#" id="mobileLogout" class="md:hidden flex items-center px-6 py-3 text-red-600 hover:bg-red-50 transition-all mt-4 border-t dark:border-gray-700">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Cerrar Sesión
            </a>
        </nav>
    </aside>

    <!-- Overlay Mobile -->
    <div id="sidebarOverlay" class="hidden fixed inset-0 bg-black/50 z-30 md:hidden"></div>

    <!-- Modal de Confirmación Logout -->
    <div id="logoutModal" class="hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm">
        <div class="flex items-center justify-center min-h-screen">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 m-4 max-w-sm w-full shadow-xl z-[70]">
                <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">¿Cerrar sesión?</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">¿Estás seguro de que deseas salir de tu cuenta?</p>
                <div class="flex justify-end gap-3">
                    <button id="cancelLogout" class="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Cancelar
                    </button>
                    <button id="confirmLogout" class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                        Sí, cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    </div>`;
};

document.addEventListener('DOMContentLoaded', function() {
    createSidebar();

    // Elementos del sidebar
    const sidebar = document.querySelector('.sidebar-content');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuIcon = document.getElementById('menuIcon');
    const closeIcon = document.getElementById('closeIcon');

    // Elementos de tema
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    // Toggle Sidebar Mobile
    const toggleSidebar = () => {
        menuIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');
        sidebar.classList.toggle('-translate-x-full');
        sidebarOverlay.classList.toggle('hidden');
        document.body.classList.toggle('overflow-hidden');
    };

    // Toggle Dark Mode
    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark');
        // also toggle on body to be robust if some selectors rely on body
        if (document.body) document.body.classList.toggle('dark');
        sunIcon.classList.toggle('hidden');
        moonIcon.classList.toggle('hidden');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };

    // Funciones para el modal de logout
    const showLogoutModal = () => {
        document.getElementById('logoutModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    };

    const hideLogoutModal = () => {
        document.getElementById('logoutModal').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    };

    const handleLogout = async () => {
        try {
            const authData = JSON.parse(localStorage.getItem('authData'));
            
            if (!authData?.token) {
                throw new Error('No hay sesión activa');
            }

            const response = await fetch('/proyecto-3er-trayecto/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                hideLogoutModal();
                localStorage.removeItem('authData');
                window.location.href = '/proyecto-3er-trayecto/login?error=session_expired';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            hideLogoutModal();
            localStorage.removeItem('authData');
            window.location.href = '/proyecto-3er-trayecto/login?error=session_expired';
        }
    };

    // Event Listeners
    mobileMenuButton?.addEventListener('click', toggleSidebar);
    sidebarOverlay?.addEventListener('click', toggleSidebar);
    themeToggle?.addEventListener('click', toggleTheme);
    
    // Logout handlers
    document.getElementById('logoutButton')?.addEventListener('click', showLogoutModal);
    document.getElementById('mobileLogout')?.addEventListener('click', showLogoutModal);
    document.getElementById('confirmLogout')?.addEventListener('click', handleLogout);
    document.getElementById('cancelLogout')?.addEventListener('click', hideLogoutModal);

    // ===== ALERTAS DE STOCK =====
    const alertsToggle = document.getElementById('alertsToggle');
    const alertsDropdown = document.getElementById('alertsDropdown');
    const alertsBadge = document.getElementById('alertsBadge');
    const alertsList = document.getElementById('alertsList');

    // Toggle dropdown de alertas
    alertsToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        alertsDropdown?.classList.toggle('hidden');
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!alertsDropdown?.contains(e.target) && !alertsToggle?.contains(e.target)) {
            alertsDropdown?.classList.add('hidden');
        }
    });

    // Cargar alertas de stock
    const loadStockAlerts = async () => {
        try {
            const response = await fetch('/proyecto-3er-trayecto/products/alerts');
            const result = await response.json();

            if (result.status === 'success') {
                const alerts = result.data || [];
                const count = result.count || 0;

                // Actualizar badge
                if (count > 0) {
                    alertsBadge.textContent = count > 99 ? '99+' : count;
                    alertsBadge.classList.remove('hidden');
                } else {
                    alertsBadge.classList.add('hidden');
                }

                // Renderizar lista de alertas
                if (alerts.length === 0) {
                    alertsList.innerHTML = `
                        <div class="p-4 text-center text-gray-500 dark:text-gray-400">
                            <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                            <p>No hay alertas de stock</p>
                        </div>
                    `;
                } else {
                    alertsList.innerHTML = alerts.map(alert => `
                        <a href="/proyecto-3er-trayecto/admin/product" class="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="font-medium text-gray-800 dark:text-gray-200 text-sm">${alert.nombre}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">${alert.categoria}</p>
                                </div>
                                <div class="text-right">
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${alert.stock === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}">
                                        ${alert.stock === 0 ? 'Sin stock' : `${alert.stock}/${alert.stock_minimo}`}
                                    </span>
                                </div>
                            </div>
                        </a>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error al cargar alertas:', error);
        }
    };

    // Cargar alertas al iniciar (solo si estamos autenticados)
    if (localStorage.getItem('authData')) {
        loadStockAlerts();
        // Actualizar cada 60 segundos
        setInterval(loadStockAlerts, 60000);
    }

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    if(initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
        if (document.body) document.body.classList.add('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if (document.body) document.body.classList.remove('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }

    // Ajustes responsive
    window.addEventListener('resize', () => {
        if(window.innerWidth >= 768) {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            menuIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        }
    });
});