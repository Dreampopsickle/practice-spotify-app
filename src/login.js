const loginButton = document.getElementById('login');

if (loginButton) {
    loginButton.addEventListener('click', function() {
        window.location.href = 'https://practice-spotify-app.onrender.com/login';
    });
}