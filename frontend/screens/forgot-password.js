const API_URL = window.location.hostname === "" ? 'http://localhost:3000/api/auth' : '/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotForm');
    const messageBox = document.getElementById('message');

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();

            // Client-side Domain Check
            if (!email.endsWith('@iut-dhaka.edu')) {
                showMessage('⚠️ Please use your IUT Dhaka email (@iut-dhaka.edu)', 'error');
                return;
            }

            showMessage('Sending reset token...', 'warning');

            try {
                const response = await fetch(`${API_URL}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('✓ Reset token sent! Redirecting...', 'success');

                    // Save email in session storage for the reset page
                    sessionStorage.setItem('resetEmail', email);

                    // Redirect to reset page after 2 seconds
                    setTimeout(() => {
                        window.location.href = 'reset-password.html';
                    }, 2000);
                } else {
                    showMessage(`⚠️ ${data.message}`, 'error');
                }
            } catch (error) {
                console.error("Forgot Password Error:", error);
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
