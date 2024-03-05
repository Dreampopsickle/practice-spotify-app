

// Gather token from callback route
const { tokenResponse } = require("../routes/callbackRoute");
console.log(tokenResponse.data);
accessToken = tokenResponse.data.access_token;
console.log("Retrieved Access Token:", accessToken);
refreshToken = tokenResponse.data.refresh_token;
console.log("Retrieved Refresh Token:", refreshToken);
accessTokenExpiry = tokenResponse.data.expires_in * 1000 + Date.now();
console.log("Retrieved Token expiry:", accessTokenExpiry);

const setAccessToken = (token, expiresIn) => {
  accessToken = token;
  accessTokenExpiry = Date.now() + expiresIn * 1000; // expiresIn is in seconds
};

//Refresh Token flow

module.exports = {
  accessToken,
  refreshToken,
  accessTokenExpiry,
  setAccessToken,
};
