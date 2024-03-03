require('dotenv').config();
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const port = process.env.PORT || 3000;

module.exports = {
    clientId,
    clientSecret,
    redirectUri,
    port
};