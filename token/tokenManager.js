// let accessToken = ""; // Access token for Spotify API
// let refreshToken = ""; // store refresh token
// let accessTokenExpiry = 0; // The expiry for tokens

// const setTokens = ({
//   accessToken: newAccessToken,
//   refreshToken: newRefreshToken,
//   expiresIn,
// }) => {
//   accessToken = newAccessToken;
//   refreshToken = newRefreshToken;
//   accessTokenExpiry = Date.now() + expiresIn * 1000; // Convert expiresIn to milliseconds
// };

// const getAccessToken = () => accessToken;
// const getRefreshToken = () => refreshToken;
// const isTokenExpired = () => Date.now() > accessTokenExpiry;

// module.exports = { setTokens, getAccessToken, getRefreshToken, isTokenExpired };

class TokenManager {
  constructor({ clientId, clientSecret, spotifyTokenUrl, axios, queryString }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.spotifyTokenUrl = spotifyTokenUrl;
    this.axios = axios;
    this.queryString = queryString;
    this.accessToken = null;
    this.refreshToken = null;
    this.expiryTime = null;
  }

  setTokens({ accessToken, refreshToken, expiresIn }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiryTime = Date.now() + expiresIn * 1000;
  }

  getAccessToken() {
    if (this.isTokenExpired()) {
      return this.refreshAccessToken();
    }
    return Promise.resolve(this.accessToken);
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  isTokenExpired() {
    return !this.expiryTime || Date.now() >= this.expiryTime;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

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
      this.setTokens({
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || this.refreshToken, //Use new refresh token if available, else use old
        expiresIn: response.data.expires_in,
      });
      return this.accessToken;
    } catch (error) {
      console.error("Error during token refresh", error);
      throw error;
    }
  }
}

module.exports = TokenManager;
