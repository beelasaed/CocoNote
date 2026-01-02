document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Replicating handleChange/formData by getting current values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // 2. Simple validation logic from your React code
        if (email && password) {
            console.log("Success! Redirecting...");
            
            // 3. navigate('/dashboard') equivalent
            window.location.href = 'dashboard.html';
        } else {
            alert('Please enter valid credentials');
        }
    });
});