require('dotenv').config();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
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

refreshAccessToken();

app.get('/login', (req, res) => {
    const scopes = 'user-read-currently-playing user-read-playback-state';
    res.redirect('https://accounts.spotify.com/authorize' + 
    '?response_type=code' +
    '&client_id=' + `${clientId}` +
    (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + 
    '&redirect_uri=' + encodeURIComponent('http://127.0.0.1:5501/public/index.html'))
});


app.post('/callback', function(req, res) {
    const code = req.body.code;

    if (!code) {
        return res.status(400).json({error: 'Invalid or missing authorization code' });
    }

    axios({
        method: 'POST', 
        url: 'https://accounts.spotify.com/api/token',
        data: qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'http://127.0.0.1:5501/public/index.html',
            client_id: `${clientId}`,
            client_secret: `${clientSecret}`
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
    axios.get('https://api.spotify.com/v1/me/player/', {
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
                songProgress: response.data.progress_ms,
                playlistName: track.name
                


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
        method: 'POST',
        url: 'https://accounts.spotify.com/api/token',
        data: qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken, 
            client_id: `${clientId}`,
            client_secret: `${clientSecret}`
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

setInterval(refreshAccessToken, 3300000);


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});