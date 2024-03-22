// Class to manage Spotify access and refresh tokens
class TokenManager {
  constructor({ clientId, clientSecret, spotifyTokenUrl, axios, queryString }) {
    // Initialize TokenManager with Spotify API credentials and necessary utilities
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.spotifyTokenUrl = spotifyTokenUrl;
    this.axios = axios; // HTTP client for making requests
    this.queryString = queryString; // Utility for query string serialization

    // Tokens and expiration time management
    this.accessToken = null;
    this.refreshToken = null;
    this.expiryTime = null;
  }

  // Method to set up or update tokens and their expiration time
  setTokens({ accessToken, refreshToken, expiresIn }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiryTime = Date.now() + expiresIn * 1000; // expiresIn is expected to be in seconds
  }

  // Method to retrieve the current access token, refreshing it if necessary
  getAccessToken() {
    if (this.isTokenExpired()) {
      return this.refreshAccessToken(); // Refresh the token if it has expired
    }
    return Promise.resolve(this.accessToken); // Return existing accessToken if valid
  }

  // Metohd to get the current refresh token
  getRefreshToken() {
    return this.refreshToken;
  }

  // Utility method to check if the current access token has exired
  isTokenExpired() {
    return !this.expiryTime || Date.now() >= this.expiryTime;
  }

  // Method to refresh the access token using the stored refresh token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available"); // Error if not refresh token is set
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

      // Update tokens with the response from Spotify
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
