// Function to refresh the Spotify access token if needed
const refreshTokenIfNeeded = async (dependencies) => {
  const { tokenManager } = dependencies;
  try {
    // Attempt to refresh the access token using the token manager
    const accessToken = await tokenManager.getAccessToken();
    console.log("Access token is refresh successfully and is", accessToken);
  } catch (error) {
    // Log any errors encountered during the token refresh process
    console.error("Error refreshing access token:", error);
  }
};

module.exports = {
  refreshTokenIfNeeded,
};
