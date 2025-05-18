document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const notification = document.getElementById('notification');

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

            // Guardar token y redirigir
            localStorage.setItem('jwt', data.token);
            
            showNotification('¡Bienvenido! Redirigiendo...', 'success');
            setTimeout(() => {
                window.location.href = '../admin/index.html';
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
});