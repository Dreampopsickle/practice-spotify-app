const loginButton = document.getElementById("login");

if (loginButton) {
  loginButton.addEventListener("click", function () {
    const baseURL = window.location.origin;
    window.location.href = `${baseURL}/login`; // will dynamically switch between dev and prod
  });
}
