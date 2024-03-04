const authStateRoute = (req, res, dependencies) => {
  const { path } = dependencies;
  res.sendFile(path.join(__dirname, "..", "src", "authenticated.html"));
};

module.exports = { authStateRoute };
