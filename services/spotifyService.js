const {
  getRefreshToken,
  setTokens,
  isTokenExpired,
} = require("../token/tokenManager"); //Token manager

const refreshAccessToken = async (dependencies) => {
  const { axios, queryString, clientId, clientSecret, spotifyTokenUrl } =
    dependencies;

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.error("No refresh token available.");
    return;
  }

  try {
    const response = await axios.post(
      spotifyTokenUrl,
      queryString.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        },
      }
    );

    // Update access and refresh tokens using tokenManager
    setTokens({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken, //Use new refresh token if available, else use old
      expiresIn: response.data.expires_in,
    });

    console.log("Access token refresh successfully");
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
};

const refreshTokenIfNeeded = async (dependencies) => {
  if (isTokenExpired) {
    await refreshAccessToken(dependencies);
  }
};

module.exports = {
  refreshTokenIfNeeded,
};
