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
                messageBox.textContent = '❌ Session expired. Please request a new token.';
                messageBox.style.color = 'red';
                messageBox.style.display = 'block';
                return;
            }

            if (newPassword !== confirmPassword) {
                messageBox.textContent = '❌ Passwords do not match.';
                messageBox.style.color = 'red';
                messageBox.style.display = 'block';
                return;
            }

            messageBox.textContent = 'Updating...';
            messageBox.style.color = 'blue';
            messageBox.style.display = 'block';

            try {
                const response = await fetch(`${API_URL}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, token, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    messageBox.style.color = 'green';
                    messageBox.textContent = '✅ Password reset successful! Redirecting to login...';

                    sessionStorage.removeItem('resetEmail');

                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    messageBox.style.color = 'red';
                    messageBox.textContent = `❌ ${data.message}`;
                }
            } catch (error) {
                console.error("Reset Password Error:", error);
                messageBox.style.color = 'red';
                messageBox.textContent = '❌ Server connection failed.';
            }
        });
    }
});
