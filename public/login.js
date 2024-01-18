const loginButton = document.getElementById('login');

if (loginButton) {
    loginButton.addEventListener('click', function() {
        window.location.href = 'http://localhost:5501/authenticated';
    });

}