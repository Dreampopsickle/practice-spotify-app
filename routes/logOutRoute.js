const logOutRoute = (req, res, dependencies) => {
  req.session.user = null;
  req.session.destroy((err) => {
    if (err) {
      console.log("Error destroying session during logout", err);
      res.status(500).send("Error logging out");
    }

    res.clearCookie("connect.sid");

    res.redirect("/login.html");
  });
};

module.exports = { logOutRoute };
