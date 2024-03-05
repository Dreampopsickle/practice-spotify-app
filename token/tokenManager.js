let accessToken = ""; // Access token for Spotify API
let refreshToken = ""; // store refresh token
let accessTokenExpiry = 0; // The expiry for tokens

const setTokens = ({
  accessToken: newAccessToken,
  refreshToken: newRefreshToken,
  expiresIn,
}) => {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  accessTokenExpiry = Date.now() + expiresIn * 1000; // Convert expiresIn to milliseconds
};

const getAccessToken = () => accessToken;
const getRefreshToken = () => refreshToken;
const isTokenExpired = () => Date.now() > accessTokenExpiry;

module.exports = { setTokens, getAccessToken, getRefreshToken, isTokenExpired };
