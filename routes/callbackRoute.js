// let { setTokens } = require("../token/tokenManager");

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
    path,
    tokenManager,
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

    // Update tokens using tokenManager
    tokenManager.setTokens({
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in,
    });

    // console.log(`Access Token Acquired: ${tokenResponse.data.access_token}`);
    // console.log(`Refresh Token Acquired: ${tokenResponse.data.refresh_token}`);
    // console.log(`Expires In: ${tokenResponse.data.expires_in}`);

    res.redirect("/authenticated");
  } catch (error) {
    console.error("Error in token exchange or fetching user details:", error);
    res.redirect("/#" + queryString.stringify({ error: "invalid_token" }));
  }
};

module.exports = { callbackRoute };
