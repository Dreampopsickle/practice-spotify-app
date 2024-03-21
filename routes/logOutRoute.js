// Route handler for logging out the user
const logOutRoute = (req, res, dependencies) => {
  // Clear user session and destroy it
  req.session.user = null;
  req.session.destroy((err) => {
    if (err) {
      console.log("Error destroying session during logout", err);
      res.status(500).send("Error logging out");
    }

    // Clear session cookie and redirect to login page
    res.clearCookie("connect.sid");

    res.redirect("/login.html");
  });
};

module.exports = { logOutRoute };
