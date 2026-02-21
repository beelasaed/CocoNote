document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const editForm = document.getElementById('editProfileForm');
    const profilePictureInput = document.getElementById('profilePictureInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Fetch current user data to populate form
    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const user = await response.json();

        // Populate fields
        document.getElementById('name').value = user.name || '';
        document.getElementById('bio').value = user.bio || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('studentId').value = user.student_id || '';
        document.getElementById('department').value = user.department || '';

        // Handle avatar preview
        if (user.profile_picture) {
            avatarPreview.innerHTML = `<img src="${user.profile_picture}" alt="Profile">`;
        }

    } catch (err) {
        console.error('Error:', err);
        alert('Failed to load profile data');
    }

    // Handle profile picture preview
    profilePictureInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            }
            reader.readAsDataURL(file);
        }
    });

    // Handle form submission
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('bio', document.getElementById('bio').value);

        if (profilePictureInput.files[0]) {
            formData.append('profilePicture', profilePictureInput.files[0]);
        }

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('Update response status:', response.status);

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response');
            }

            if (response.ok) {
                alert('Profile updated successfully!');
                window.location.href = 'profile.html';
            } else {
                console.error('Update failed logic:', data);
                alert(data.message || 'Update failed');
            }
        } catch (err) {
            console.error('Detailed Error updating profile:', err);
            alert('An error occurred: ' + err.message);
        }
    });

    // Handle account deletion
    deleteAccountBtn.addEventListener('click', async () => {
        const confirmDelete = confirm('Are you sure you want to delete your account? This action is permanent and will delete all your notes and data.');

        if (confirmDelete) {
            try {
                const response = await fetch('/api/auth/profile', {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    alert('Your account has been deleted.');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to delete account');
                }
            } catch (err) {
                console.error('Error deleting account:', err);
                alert('An error occurred while deleting account');
            }
        }
    });
});
