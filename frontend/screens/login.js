const API_URL = window.location.hostname === "" ? 'http://localhost:3000/api/auth' : '/api/auth';

function initGoogleButton(callback, buttonId = "googleBtn", text = "continue_with") {
    const render = () => {
        google.accounts.id.initialize({
            client_id: "1089791815986-jje44qn5pteaj3ra4s27fs949r1dce29.apps.googleusercontent.com",
            callback: callback
        });
        google.accounts.id.renderButton(
            document.getElementById(buttonId),
            { theme: "outline", size: "large", width: "100%", text: text }
        );
    };

    if (window.google) {
        render();
    } else {
        // Wait for script to load if not ready
        window.addEventListener('load', () => {
            if (window.google) render();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = document.querySelector('.auth-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Step 0: Client-side Domain Check
            if (!email.endsWith('@iut-dhaka.edu')) {
                errorMsg.textContent = '⚠️ Please use your IUT Dhaka email (@iut-dhaka.edu)';
                errorMsg.classList.add('show');
                return;
            }

            // Reset UI
            errorMsg.classList.remove('show');
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
                    // 2. SUCCESS: Clear old user data
                    localStorage.removeItem('backend_notifications');
                    localStorage.removeItem('coco_notifications');
                    localStorage.removeItem('coco_has_unread');

                    // 3. Save New User Token & Info
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // 4. Redirect to Dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // 4. ERROR: Show message (e.g., "Invalid Password")
                    errorMsg.textContent = `⚠️ ${data.message}`;
                    errorMsg.classList.add('show');
                    submitBtn.textContent = 'Login';
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error("Login Error:", error);
                errorMsg.textContent = '⚠️ Server connection failed. Please try again.';
                errorMsg.classList.add('show');
                submitBtn.textContent = 'Login';
                submitBtn.disabled = false;
            }
        });
    }

    // Initialize Google Button
    initGoogleButton(handleGoogleResponse);
});

async function handleGoogleResponse(response) {
    console.log("DEBUG: frontend received Google response");
    const errorMsg = document.getElementById('errorMsg');

    try {
        const res = await fetch(`${API_URL}/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            if (data.isNewUser) {
                // Save google data and redirect to register with a flag
                localStorage.setItem('tempGoogleUser', JSON.stringify(data.googleData));
                window.location.href = 'register.html?mode=google';
            } else {
                // Existing user: Login
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            }
        } else {
            errorMsg.textContent = `⚠️ ${data.message || 'Google login failed. Please try again.'}`;
            errorMsg.classList.add('show');
        }
    } catch (err) {
        console.error("Google Auth Error:", err);
        errorMsg.textContent = '⚠️ Google authentication failed. Please try again.';
        errorMsg.classList.add('show');
    }
}