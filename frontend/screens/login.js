const API_URL = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = document.querySelector('.auth-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Reset UI
            errorMsg.style.display = 'none';
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            try {
                // 1. Send Login Request to Backend
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // 2. SUCCESS: Save Token & User Info
                    // The token is your "digital ID card" for the rest of the app
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // 3. Redirect to Dashboard
                    window.location.href = 'dashboard.html'; 
                } else {
                    // 4. ERROR: Show message (e.g., "Invalid Password")
                    errorMsg.textContent = `❌ ${data.message}`;
                    errorMsg.style.display = 'block';
                    submitBtn.textContent = 'Login';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error("Login Error:", error);
                errorMsg.textContent = '❌ Server connection failed. Is backend running?';
                errorMsg.style.display = 'block';
                submitBtn.textContent = 'Login';
                submitBtn.disabled = false;
            }
        });
    }
});