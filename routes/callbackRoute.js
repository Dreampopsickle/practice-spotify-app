let accessTokenExpiry = 0;
let { accessToken, refreshToken } = require("../token/token");

const callbackRoute = async (req, res, dependencies) => {
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
    path
  } = dependencies;
  const code = req.query.code || null;
  console.log(code);
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  // check if we've even made a request yet
  if (state === null || state !== storedState) {
    res.redirect("/#" + queryString.stringify({ error: "state_mismatch" }));
    // if we didn't already make a request, redirect to the state_mismatch string and get out of here
    return;
  }
  // if we did already make a request, let's reset the "stateKey" cookie
  res.clearCookie(stateKey);

  // now let's attempt to make a request
  try {
    const tokenResponse = await axios.post(
      spotifyTokenUrl,
      queryString.stringify({
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
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
    console.log(tokenResponse.data);
    accessToken = tokenResponse.data.access_token;
    console.log("Retrieved Access Token:", accessToken);
    refreshToken = tokenResponse.data.refresh_token;
    console.log("Retrieved Refresh Token:", refreshToken);
    accessTokenExpiry = tokenResponse.data.expires_in * 1000 + Date.now();
    console.log("Retrieved Token expiry", accessTokenExpiry);

    req.session.accessToken = accessToken;
    setAccessToken(accessToken, accessTokenExpiry);

    res.redirect("/authenticated");
  } catch (error) {
    console.error("Error in token exchange or fetching user details:", error);
    res.redirect("/#" + queryString.stringify({ error: "invalid_token" }));
  }
};

function setAccessToken(token, expiresIn) {
  accessToken = token;
  accessTokenExpiry = Date.now() + expiresIn * 1000; // expiresIn is in seconds
}

module.exports = { callbackRoute };
