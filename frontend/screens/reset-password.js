const API_URL = window.location.hostname === "" ? 'http://localhost:3000/api/auth' : '/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('resetForm');
    const messageBox = document.getElementById('message');

    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = sessionStorage.getItem('resetEmail');
            const token = document.getElementById('token').value.trim();
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!email) {
                showMessage('⚠️ Session expired. Please request a new token.', 'error');
                return;
            }

            // Validate new password
            const passwordError = validatePassword(newPassword);
            if (passwordError) {
                showMessage(passwordError, 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessage('⚠️ Passwords do not match.', 'error');
                return;
            }

            showMessage('Updating your password...', 'warning');

            try {
                const response = await fetch(`${API_URL}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, token, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('✓ Password reset successful! Redirecting to login...', 'success');

                    sessionStorage.removeItem('resetEmail');

                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showMessage(`⚠️ ${data.message}`, 'error');
                }
            } catch (error) {
                console.error("Reset Password Error:", error);
                showMessage('⚠️ Server connection failed. Please try again.', 'error');
            }
        });
    }
});

function showMessage(text, type = 'error') {
    const messageBox = document.getElementById('message');
    messageBox.textContent = text;
    
    // Remove all alert type classes
    messageBox.classList.remove('alert-error', 'alert-warning', 'alert-success');
    
    // Add the appropriate class
    switch(type) {
        case 'error':
            messageBox.classList.add('alert-error');
            break;
        case 'warning':
            messageBox.classList.add('alert-warning');
            break;
        case 'success':
            messageBox.classList.add('alert-success');
            break;
        default:
            messageBox.classList.add('alert-error');
    }
    
    messageBox.classList.add('show');
}

function validatePassword(password) {
    if (!password || password.length < 5) {
        return '⚠️ Password must be at least 5 characters long';
    }
    if (!/[a-zA-Z]/.test(password)) {
        return '⚠️ Password must contain at least one letter';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return '⚠️ Password must contain at least one special character';
    }
    return null;
}
