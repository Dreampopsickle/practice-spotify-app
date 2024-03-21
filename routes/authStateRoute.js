// Route handler to check authentication state and serve authenticated page
const authStateRoute = (req, res, dependencies) => {
  const { path } = dependencies;
  // Send the authenticated HTML file to the client
  res.sendFile(path.join(__dirname, "..", "src", "authenticated.html"));
};

module.exports = { authStateRoute };
