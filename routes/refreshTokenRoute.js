// Route handler to refresh the SPotify access token
const refreshRoute = async (req, res, dependencies) => {
  const { tokenManager } = dependencies;
  try {
    const accessToken = await tokenManager.getAccessToken();

    if (!accessToken) {
      return res.status(400).send({ error: "Unable to refresh access token" });
    }

    // Send the new access token to the client
    res.send({ accessToken });
  } catch (error) {
    console.error("Error during token refresh", error);
    res.status(500).send({ error: "Internal Service Error" });
  }
};

module.exports = { refreshRoute };
