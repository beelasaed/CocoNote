const API_URL = window.location.hostname === "" ? 'http://localhost:3000/api/auth' : '/api/auth';

function initGoogleButton(callback, buttonId = "googleBtn", text = "signup_with") {
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

let isGoogleMode = false; // Track locally to avoid reload dependency

document.addEventListener('DOMContentLoaded', async () => {
    const deptSelect = document.getElementById('department');
    const registerForm = document.getElementById('registerForm');
    const messageBox = document.getElementById('message');

    // --- 1. Load Departments Automatically ---
    if (deptSelect) {
        try {
            const res = await fetch(`${API_URL}/departments`);
            const departments = await res.json();
            deptSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.department_id;
                option.textContent = dept.name;
                deptSelect.appendChild(option);
            });
        } catch (err) {
            console.error("Failed to load departments", err);
            deptSelect.innerHTML = '<option disabled>Error loading options</option>';
        }
    }

    // --- 2. Auto-populate Batch & Domain Logic ---
    const studentIdInput = document.getElementById('student_id');
    const batchDisplay = document.getElementById('batch_display');

    if (studentIdInput && batchDisplay) {
        studentIdInput.addEventListener('input', () => {
            const id = studentIdInput.value.trim();
            if (/^\d{9}$/.test(id)) {
                const batch = id.substring(0, 2);
                const batchNum = parseInt(batch);
                if (batchNum >= 12 && batchNum <= 24) {
                    batchDisplay.value = batch;
                    messageBox.classList.remove('show');
                } else {
                    batchDisplay.value = '';
                    showMessage('⚠️ Invalid Student ID. Batch must be between 12 and 24.', 'error');
                }
            } else {
                batchDisplay.value = '';
            }
        });
    }

    // --- 2.1 Check for Google Mode (Refresh/Direct Link Case) ---
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'google') {
        const tempGoogleUser = JSON.parse(localStorage.getItem('tempGoogleUser'));
        if (tempGoogleUser) {
            activateGoogleMode(tempGoogleUser);
        }
    }

    // --- 3. Handle Form Submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email');
            const emailError = document.getElementById('email-error');
            const email = emailInput.value;
            const studentId = document.getElementById('student_id').value;

            // Validation
            if (!/^\d{9}$/.test(studentId)) {
                showMessage('⚠️ Invalid Student ID. It must be 9 digits long.', 'error');
                return;
            }

            const batchValue = batchDisplay ? batchDisplay.value : '';
            if (!batchValue) {
                showMessage('⚠️ Valid Student ID required to determine batch.', 'error');
                return;
            }

            const formData = {
                name: document.getElementById('name').value,
                student_id: studentId,
                department_id: document.getElementById('department').value,
                batch: parseInt(batchValue),
                email: email
            };

            if (!isGoogleMode) {
                formData.password = document.getElementById('password').value;
                formData.confirmPassword = document.getElementById('confirmPassword').value;
            }

            if (!email.endsWith('@iut-dhaka.edu')) {
                emailInput.classList.add('error-border');
                emailError.style.display = 'block';
                return;
            }

            if (!isGoogleMode) {
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                // Validate password
                const passwordError = validatePassword(password);
                if (passwordError) {
                    showMessage(passwordError, 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    showMessage('⚠️ Passwords do not match.', 'error');
                    return;
                }
                
                formData.password = password;
                formData.confirmPassword = confirmPassword;
            }

            showMessage(isGoogleMode ? 'Setting up your account...' : 'Creating your account...', 'warning');

            try {
                const endpoint = isGoogleMode ? 'google-register' : 'register';
                const response = await fetch(`${API_URL}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('✓ Welcome to CocoNote! Redirecting...', 'success');
                    if (isGoogleMode) {
                        localStorage.removeItem('tempGoogleUser');
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        setTimeout(() => window.location.href = 'dashboard.html', 1500);
                    } else {
                        setTimeout(() => window.location.href = 'login.html', 2000);
                    }
                } else {
                    showMessage(`⚠️ ${data.message}`, 'error');
                }
            } catch (error) {
                showMessage('⚠️ Server error. Please try again.', 'error');
            }
        });
    }

    initGoogleButton(handleGoogleResponse);
});

// --- UTILS ---

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

function activateGoogleMode(user) {
    isGoogleMode = true;
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const h2 = document.querySelector('h2');
    const subtitle = h2?.nextElementSibling;
    const authBtn = document.querySelector('.auth-btn');
    const googleSection = document.getElementById('googleBtn')?.parentElement;

    if (nameInput) { nameInput.value = user.name; nameInput.readOnly = true; }
    if (emailInput) { emailInput.value = user.email; emailInput.readOnly = true; }

    if (passwordInput) {
        passwordInput.required = false;
        passwordInput.parentElement.style.display = 'none';
    }
    if (confirmInput) {
        confirmInput.required = false;
        confirmInput.parentElement.style.display = 'none';
    }

    if (h2) h2.textContent = 'Complete Your Profile';
    if (subtitle) subtitle.textContent = 'Just a few more details to set up your account.';
    if (authBtn) authBtn.textContent = 'Finish Registration';
    if (googleSection) googleSection.style.display = 'none'; // Hide the button after use

    showMessage('Google account verified! Complete your ID and Department.', 'success');
}

async function handleGoogleResponse(response) {
    try {
        const res = await fetch(`${API_URL}/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            if (data.isNewUser) {
                // SEAMLESS TRANSITION: Dynamically activate google mode
                localStorage.setItem('tempGoogleUser', JSON.stringify(data.googleData));
                activateGoogleMode(data.googleData);
            } else {
                // "should not log me in immediately" - per user request
                showMessage('You already have an account! Please go to the Login page to continue.', 'warning');
                // Opt-in: Add a button to go to login
                const loginLink = document.createElement('a');
                loginLink.href = 'login.html';
                loginLink.className = 'link-gold';
                loginLink.textContent = ' Go to Login page';
                setTimeout(() => document.getElementById('message').appendChild(loginLink), 100);
            }
        } else {
            showMessage(`⚠️ ${data.message || 'Google authentication failed. Please try again.'}`, 'error');
        }
    } catch (err) {
        console.error("Google Auth Error:", err);
        showMessage('⚠️ Google authentication failed. Please try again.', 'error');
    }
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
