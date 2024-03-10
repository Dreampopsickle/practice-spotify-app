const refreshTokenIfNeeded = async (dependencies) => {
  const { tokenManager } = dependencies;
  try {
    const accessToken = await tokenManager.getAccessToken();
    console.log("Access token is refresh successfully and is", accessToken);
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
};

module.exports = {
  refreshTokenIfNeeded,
};
