const API_URL = window.location.hostname === "" ? 'http://localhost:3000/api/auth' : '/api/auth';

document.addEventListener('DOMContentLoaded', async () => {
    const deptSelect = document.getElementById('department');
    const registerForm = document.getElementById('registerForm');
    const messageBox = document.getElementById('message');

    // --- 1. Load Departments Automatically ---
    // This fetches the list (CSE, ME, EEE) from your database
    if (deptSelect) {
        try {
            const res = await fetch(`${API_URL}/departments`);
            const departments = await res.json();

            // Clear "Loading..." text
            deptSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';

            // Add options from database
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

    // --- 2. Auto-populate Batch from Student ID ---
    const studentIdInput = document.getElementById('student_id');
    const batchDisplay = document.getElementById('batch_display');

    // --- 2.1 Check for Google Mode ---
    const params = new URLSearchParams(window.location.search);
    const isGoogleMode = params.get('mode') === 'google';
    let tempGoogleUser = null;

    if (isGoogleMode) {
        tempGoogleUser = JSON.parse(localStorage.getItem('tempGoogleUser'));
        if (tempGoogleUser) {
            // Fill pre-known data
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');

            if (nameInput) {
                nameInput.value = tempGoogleUser.name;
                nameInput.readOnly = true;
            }
            if (emailInput) {
                emailInput.value = tempGoogleUser.email;
                emailInput.readOnly = true;
            }

            // Hide password fields
            const passwordGroup = document.getElementById('password')?.parentElement;
            const confirmGroup = document.getElementById('confirmPassword')?.parentElement;
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('confirmPassword');
            if (passwordInput) passwordInput.required = false;
            if (confirmInput) confirmInput.required = false;

            if (passwordGroup) passwordGroup.style.display = 'none';
            if (confirmGroup) confirmGroup.style.display = 'none';

            // Update UI text
            const h2 = document.querySelector('h2');
            if (h2) h2.textContent = 'Complete Your Profile';
            const authBtn = document.querySelector('.auth-btn');
            if (authBtn) authBtn.textContent = 'Finish Registration';

            const subtitle = h2?.nextElementSibling;
            if (subtitle) subtitle.textContent = 'Please provide your IUT details to continue';
        }
    }

    if (studentIdInput && batchDisplay) {
        studentIdInput.addEventListener('input', () => {
            const id = studentIdInput.value.trim();
            if (/^\d{9}$/.test(id)) {
                const batch = id.substring(0, 2);
                const batchNum = parseInt(batch);
                if (batchNum >= 12 && batchNum <= 24) {
                    batchDisplay.value = batch;
                    messageBox.style.display = 'none';
                } else {
                    batchDisplay.value = '';
                    messageBox.style.display = 'block';
                    messageBox.style.color = 'red';
                    messageBox.textContent = '❌ Invalid Student ID. Batch must be between 12 and 24.';
                }
            } else {
                batchDisplay.value = '';
            }
        });
    }

    // --- 3. Handle Form Submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collect all data
            const emailInput = document.getElementById('email');
            const emailError = document.getElementById('email-error');
            const email = emailInput.value;

            // Reset Field Errors
            emailInput.classList.remove('error-border');
            emailError.style.display = 'none';

            const studentId = document.getElementById('student_id').value;

            // Student ID validation: 9 digits, numeric only
            if (!/^\d{9}$/.test(studentId)) {
                messageBox.style.display = 'block';
                messageBox.style.color = 'red';
                messageBox.textContent = '❌ Invalid Student ID. It must be 9 digits long and contain only numbers.';
                return;
            }

            const batchValue = batchDisplay ? batchDisplay.value : '';
            if (!batchValue) {
                messageBox.style.display = 'block';
                messageBox.style.color = 'red';
                messageBox.textContent = '❌ Please enter a valid 9-digit Student ID to determine your batch.';
                return;
            }

            const formData = {
                name: document.getElementById('name').value,
                student_id: studentId,
                department_id: document.getElementById('department').value,
                batch: parseInt(batchValue),
                email: email
            };

            // Only add passwords if NOT in google mode
            if (!isGoogleMode) {
                formData.password = document.getElementById('password').value;
                formData.confirmPassword = document.getElementById('confirmPassword').value;
            }

            // Step 0: Client-side Domain Check
            if (!email.endsWith('@iut-dhaka.edu')) {
                emailInput.classList.add('error-border');
                emailError.style.display = 'block';
                return;
            }

            // Show Loading State
            messageBox.style.display = 'block';
            messageBox.style.color = 'blue';
            messageBox.textContent = isGoogleMode ? 'Finalizing registration...' : 'Creating account...';

            try {
                // Send data to Backend
                const endpoint = isGoogleMode ? 'google-register' : 'register';
                const response = await fetch(`${API_URL}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Success!
                    messageBox.style.color = 'green';
                    messageBox.textContent = '✅ Success! Redirecting...';

                    if (isGoogleMode) {
                        localStorage.removeItem('tempGoogleUser');
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1500);
                    } else {
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    }
                } else {
                    // Error from server (e.g. "Email already exists")
                    messageBox.style.color = 'red';
                    messageBox.textContent = `❌ ${data.message}`;
                }
            } catch (error) {
                messageBox.style.color = 'red';
                messageBox.textContent = '❌ Server Error. Is the backend running?';
            }
        });
    }
});
