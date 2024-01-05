const qs = require('qs');
const express = require('express');
const app = express();
const port = 5502;
const cors = require('cors');
const axios = require('axios');
let spotifyAccessToken = '';
let refreshToken;

app.use(cors());
app.use(express.json());


app.get('/login', (req, res) => {
    const scopes = 'user-read-currently-playing user-read-playback-state';
    res.redirect('https://accounts.spotify.com/authorize' + 
    '?response_type=code' +
    '&client_id=' + 'c451b00f6a704a9593e11cc1ac6102f6' +
    (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + 
    '&redirect_uri=' + encodeURIComponent('http://127.0.0.1:5501/public/index.html'))
});

app.post('/callback', function(req, res) {
    const code = req.body.code;

    if (!code) {
        return res.status(400).json({error: 'Invalid or missing authorization code' });
    }

    axios({
        method: 'post', 
        url: 'https://accounts.spotify.com/api/token',
        data: qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'http://127.0.0.1:5501/public/index.html',
            client_id: 'c451b00f6a704a9593e11cc1ac6102f6',
            client_secret: '109b273e43e74c1a9a25c39e893c8ff9'
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(response => {
        spotifyAccessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        res.json(response.data);
    }).catch(error => {
        res.status(500).json({ error: 'Internal Server Error' });
    });
});



app.get('/currently-playing', function(req, res) {
    axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`
        }
    })
    .then(response => {
        console.log("Spotify Repsonse:", response.data);
        if (response.data && response.data.item) {
            const track = response.data.item;
            const trackInfo = {
                songName: track.name,
                artistName: track.artists.map(artist => artist.name).join(", "),
                albumName: track.album.name,
                albumCoverArt: track.album.images[0].url,
                songDuration: track.duration_ms,
                songProgress: response.data.progress_ms
                


            };
            console.log('Sending Track Info:', trackInfo);
            res.json(trackInfo);
            console.log('Success');
        } else {
           res.status(204).send('No track is currently playing'); 
        }
    })
    .catch(error => {
        res.status(500).send(error.message);
        console.log('Something Failed');
    });
});



function refreshAccessToken() {
    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken, 
            client_id: 'c451b00f6a704a9593e11cc1ac6102f6',
            client_secret: '109b273e43e74c1a9a25c39e893c8ff9'
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
        spotifyAccessToken = response.data.access_token;
        if (response.data.refresh_token) {
            refreshToken = response.data.refresh_token;
        }
    })
    .catch(error => {
        console.error('Error refreshing access token', error);
    });
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});