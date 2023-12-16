function getAuthorizeUrl() {
    const clientId = 'c451b00f6a704a9593e11cc1ac6102f6';
    const redirectUri = encodeURIComponent('http://localhost:8888/callback');
    const scopes = encodeURIComponent('user-read-currently-playing user-read-playback-state');
    return `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;
}

window.location = getAuthorizeUrl();

function getAuthorizationCode() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('code');
}

function getAccessToken(authCode) {
    const clientId = 'c451b00f6a704a9593e11cc1ac6102f6';
    const clientSecret = '109b273e43e74c1a9a25c39e893c8ff9';
    const redirectUri = 'http://127.0.0.1:5500/index.html';

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
    });

    return fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    })
    .then(repsonse => Response.json())
    .then(data => {
        console.log(data);
        return data.access_token;
    })
    .catch(error => console.error('Error', error));


}