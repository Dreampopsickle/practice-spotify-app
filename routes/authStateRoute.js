// Route handler to check authentication state and serve authenticated page
const authStateRoute = (req, res, dependencies) => {
  const { path } = dependencies;
  // Send the authenticated HTML file to the client
  res.sendFile(
    path.join(__dirname, "..", "my-spotify-app", "dist", "index.html")
  );
};

module.exports = { authStateRoute };
