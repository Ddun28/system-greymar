    const form = document.querySelector('form');
    const notification = document.getElementById('notification');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Función para mostrar/ocultar contraseña
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Cambiar icono
        togglePassword.innerHTML = type === 'password' 
            ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
               </svg>`
            : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M10.586 10.586l-2.829 2.828m4.243 2.828l7.071-7.071M6 6l3.781 3.781M12 12l2.138 2.138M3 3l18 18" />
               </svg>`;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            usuario: form.querySelector('input[type="text"]').value,
            password: form.querySelector('input[type="password"]').value
        };

        try {
            const response = await fetch('/proyecto-3er-trayecto/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en autenticación');
            }

             // Decodificar el token JWT para obtener los datos del usuario
            const tokenPayload = JSON.parse(atob(data.token.split('.')[1])).data;

            // Guardar datos en localStorage
            localStorage.setItem('authData', JSON.stringify({
                token: data.token,
                user: {
                    id: tokenPayload.id,
                    username: tokenPayload.usuario,
                    firstName: tokenPayload.nombre,
                    lastName: tokenPayload.apellido,
                    role: tokenPayload.cargo
                }
            }));
            
            showNotification('¡Bienvenido! Redirigiendo...', 'success');
            setTimeout(() => {
                window.location.href = '/proyecto-3er-trayecto/admin';
            }, 1500);

        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
