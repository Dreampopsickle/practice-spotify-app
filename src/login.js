const loginButton = document.getElementById("login");

// if (loginButton) {
//   loginButton.addEventListener("click", function () {
//     window.location.href = "http://localhost:5502/login";
//   });
// }

// Add event listener to the login button to redirect to the login page
if (loginButton) {
  loginButton.addEventListener("click", function () {
    window.location.href = "https://practice-spotify-app.onrender.com/login";
  });
}
