const createSidebar = () => {
    const sidebarContainer = document.querySelector('#sidebar');
    const username = "Dun"; 
    
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
            <h2 class="text-2xl font-bold bg-gradient-to-r from-[#4F46E5] md:pt-4 to-[#06B6D4] bg-clip-text text-transparent">
                GREYMAR
            </h2>
        </div>
        
        <nav class="mt-6">
            <!-- Inicio -->
            <a href="../../admin/index.html" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Inicio
            </a>

            <!-- Usuarios -->
            <a href="../admin/users/index.html" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Usuarios
            </a>

            <!-- Categorías -->
            <a href="../admin/category/index.html" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
                Categoria
            </a>

            <!-- Productos -->
            <a href="../admin/product/index.html" class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                Productos
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
    <div id="sidebarOverlay" class="hidden fixed inset-0 bg-black/50 z-30 md:hidden"></div>`;
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
        sunIcon.classList.toggle('hidden');
        moonIcon.classList.toggle('hidden');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };

    // Manejar Logout
    const handleLogout = async () => {
        try {
            const response = await fetch('/proyecto-3er-trayecto/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                localStorage.removeItem('jwt');
                window.location.href = '../auth/index.html';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Event Listeners
    mobileMenuButton?.addEventListener('click', toggleSidebar);
    sidebarOverlay?.addEventListener('click', toggleSidebar);
    themeToggle?.addEventListener('click', toggleTheme);
    document.getElementById('logoutButton')?.addEventListener('click', handleLogout);
    document.getElementById('mobileLogout')?.addEventListener('click', handleLogout);

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    if(initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
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