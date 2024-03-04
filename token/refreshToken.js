const { response, res } = require("../routes/refreshTokenRoute");

accessToken = response.data.access_token;
console.log(`Access Token updated: ${accessToken}`);
refreshToken = response.data.refresh_token || refreshToken;
console.log(`Refresh Token updated: ${refreshToken}`);

res.send({
  access_token: accessToken,
  refresh_token: refreshToken,
});

module.exports = { accessToken, refreshToken };
