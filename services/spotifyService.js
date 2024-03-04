let { accessToken, refreshToken } = require('../token/token')
//Token storage


//Spotify OAuth URLs

const spotifyTokenUrl = 'https://accounts.spotify.com/api/token';
const { accessTokenExpiry } = require('../routes/callbackRoute');

const refreshAccessToken = async () => {
    console.log('Attempting to refresh access token with refresh token:', refreshToken);

    if (!refreshToken) {
        console.error('No refresh token available.');
        return;
    }
    
    const refreshData = queryString.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });

    const refreshOptions = {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(clientId + ":" + clientSecret).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    axios.post(spotifyTokenUrl, refreshData, refreshOptions)
        .then(response => {
            if (response.data.access_token) {
                accessToken = response.data.access_token;
                console.log('Access token refreshed successfully');
            }
            if (response.data.refresh_token) {
                refreshToken = response.data.refresh_token;
            }
        }).catch(error =>{
            console.error('Error refreshing access token:', error);
        })
};

const refreshTokenIfNeeded = async () => {
    if (Date.now() > accessTokenExpiry) {
        await refreshAccessToken();
    }
};

module.exports = { refreshAccessToken, refreshTokenIfNeeded };