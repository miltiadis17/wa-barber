// Auth handling for login page
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Check if already logged in
    checkAuth();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to dashboard
                window.location.href = '/admin/dashboard.html';
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            showError('Connection error. Please try again.');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    async function checkAuth() {
        try {
            const response = await fetch('/api/admin/auth/check');
            const data = await response.json();

            if (data.authenticated) {
                window.location.href = '/admin/dashboard.html';
            }
        } catch (error) {
            // Not authenticated, stay on login page
        }
    }
});
