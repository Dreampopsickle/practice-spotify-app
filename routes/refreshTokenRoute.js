let { accessToken, refreshToken, accessTokenExpiry  } = require("../token/refreshToken");

const refreshRoute = async (req, res, dependencies) => {
  const {
    clientId,
    clientSecret,
    redirectUri,
    port,
    spotifyAuthUrl,
    spotifyTokenUrl,
    stateKey,
    crypto,
    queryString,
    axios,
    path,
  } = dependencies;

  const currentRefreshToken = req.query.refresh_token || refreshToken;

  try {
    const response = await axios.post(
      spotifyTokenUrl,
      queryString.stringify({
        grant_type: "refresh_token",
        refresh_token: currentRefreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
      }
    );

    //Update access token and refresh token
    module.exports = { response, res };

    
  } catch (error) {
    console.error("Error during token refresh", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { refreshRoute };
