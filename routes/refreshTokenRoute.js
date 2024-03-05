
const { getRefreshToken, setTokens } = require('../token/tokenManager')

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

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return res.status(400).send({ error: 'No refresh token available'});
  };

  // const currentRefreshToken = req.query.refresh_token || refreshToken;

  try {
    const response = await axios.post(
      spotifyTokenUrl,
      queryString.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken, // replaces currentRefreshToken
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

    //Update tokens using tokenManager
    setTokens({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken, // use new refresh token if provided, else use old one
      expiresIn: response.data.expires_in,
    });

    res.send({ accessToken: response.data.access_token });
  } catch (error) {
    console.error("Error during token refresh", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { refreshRoute };
