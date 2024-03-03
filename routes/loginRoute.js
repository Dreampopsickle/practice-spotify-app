const loginRoute = (app) => {
    app.get('/login', (req, res) => {

        const state = generateRandomString(16);
        res.cookie(stateKey, state);
    
        const params = {
            response_type: 'code',
            client_id: clientId,
            scope: 'user-read-currently-playing user-read-playback-state',
            redirect_uri: redirectUri,
            state: state
        }
    
        // construct full URL for redirection
    
        const authUrl = `${spotifyAuthUrl}?${queryString.stringify(params)}`;
    
        //Redirect to Spotify's auth page
        console.log(authUrl);
        res.redirect(authUrl);
        console.log('Login route is working')
    })
};

module.exports = { loginRoute };