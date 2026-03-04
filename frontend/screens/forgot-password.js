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
                messageBox.textContent = '❌ Only @iut-dhaka.edu emails are allowed.';
                messageBox.style.color = 'red';
                messageBox.style.display = 'block';
                return;
            }

            messageBox.textContent = 'Sending...';
            messageBox.style.color = 'blue';
            messageBox.style.display = 'block';

            try {
                const response = await fetch(`${API_URL}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    messageBox.style.color = 'green';
                    messageBox.textContent = '✅ Reset token sent! Check server console.';

                    // Save email in session storage for the reset page
                    sessionStorage.setItem('resetEmail', email);

                    // Redirect to reset page after 2 seconds
                    setTimeout(() => {
                        window.location.href = 'reset-password.html';
                    }, 2000);
                } else {
                    messageBox.style.color = 'red';
                    messageBox.textContent = `❌ ${data.message}`;
                }
            } catch (error) {
                console.error("Forgot Password Error:", error);
                messageBox.style.color = 'red';
                messageBox.textContent = '❌ Server connection failed.';
            }
        });
    }
});
