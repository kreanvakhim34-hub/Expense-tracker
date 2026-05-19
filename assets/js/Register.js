// assets/js/Register.js

function showSignUp() {
    document.getElementById('signin-card').classList.add('hidden');
    document.getElementById('signup-card').classList.remove('hidden');
}

function showSignIn() {
    document.getElementById('signin-card').classList.remove('hidden');
    document.getElementById('signup-card').classList.add('hidden');
}

function togglePassword(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Handle password toggle clicks
document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function () {
        const inputId = this.getAttribute('data-target');
        togglePassword(inputId);
    });
});

// Sign-in form submission
const signInForm = document.getElementById('signin-form');
signInForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const errorMessage = document.getElementById('signin-error');
    const users = JSON.parse(localStorage.getItem('users')) || [];

    errorMessage.textContent = '';

    if (!email || !password) {
        errorMessage.textContent = 'Please fill in all fields.';
        return;
    }

    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        errorMessage.textContent = 'Invalid email or password.';
        return;
    }

    // Successful login
    localStorage.setItem('currentUser', email);
    localStorage.setItem('currentUsername', user.username);
    localStorage.setItem('isAuthenticated', 'true');

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
});

// Sign-up form submission
const signUpForm = document.getElementById('signup-form');
signUpForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const errorMessage = document.getElementById('signup-error');
    const successMessage = document.getElementById('signup-success');
    const users = JSON.parse(localStorage.getItem('users')) || [];

    errorMessage.textContent = '';
    successMessage.textContent = '';

    if (!username || !email || !password || !confirmPassword) {
        errorMessage.textContent = 'Please fill in all fields.';
        return;
    }

    if (users.some(user => user.email === email)) {
        errorMessage.textContent = 'Email already exists.';
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match.';
        return;
    }

    // Save new user
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login after signup
    localStorage.setItem('currentUser', email);
    localStorage.setItem('currentUsername', username);
    localStorage.setItem('isAuthenticated', 'true');

    // Show success message
    successMessage.textContent = 'Account created successfully! Redirecting...';

    // Redirect to dashboard after short delay
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
});