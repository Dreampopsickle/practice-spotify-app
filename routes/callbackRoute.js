// Route handler for the Spotify OAuth callback
const callbackRoute = async (req, res, dependencies) => {
  // Destructure dependencies for ease of use
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

  // Extract authorization code and state form query parameters
  const code = req.query.code || null;
  console.log(code);
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  // Validate state paramter to prevent CSRF attacks
  if (state === null || state !== storedState) {
    res.redirect("/#" + queryString.stringify({ error: "state_mismatch" }));
    return;
  }
  // if we did already make a request, let's reset the "stateKey" cookie
  res.clearCookie(stateKey);

  // Request access and refresh tokens from Spotify
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

    // Update tokens in the session or token store
    tokenManager.setTokens({
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in,
    });

    // Redirect to authenticated state page
    res.redirect("/authenticated");
  } catch (error) {
    console.error("Error in token exchange or fetching user details:", error);
    res.redirect("/#" + queryString.stringify({ error: "invalid_token" }));
  }
};

module.exports = { callbackRoute };
