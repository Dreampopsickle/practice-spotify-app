require('dotenv').config();
const express = require('express');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const queryString = require('querystring');
const crypto = require('crypto');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const port = process.env.PORT || 3000;

// Initialize Express app
const app = express();

// Create an HTTP server 
const server = http.createServer(app)
const ws = new WebSocket.Server({ server });

let accessToken = ''; // Access token for Spotify API
let refreshToken = ''; // store refresh token
let lastTrackId = null; // Store the ID of the last track played
const pollingInterval = 5000; // Poll every 5 seconds

//Spotify OAuth URLs
const spotifyAuthUrl = 'https://accounts.spotify.com/authorize?';
const spotifyTokenUrl = 'https://accounts.spotify.com/api/token';

const generateRandomString = (length) => {
    return crypto
    .randomBytes(60)
    .toString('hex')
    .slice(0, length);
};

const stateKey = 'spotify_auth_state';

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser)

app.get('/login', (req, res) => {

    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    const scope = 'user-read-currently-playing user-read-playback-state';
    res.redirect(spotifyAuthUrl + queryString.stringify({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        state: state
    }));
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios({
            method: 'POST',
            url: spotifyTokenUrl,
            data: queryString.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
            },
        });
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        console.log('Access token set:', accessToken);
        res.redirect('/authenticated'); // Redirect to the main page after successful
    } catch (error) {
        console.error('Error during Spotify authentication:', error);
        res.status(500).send('Authentication Failed');
    }
});

const refreshAccessToken = async () => {
    try {
        const response = await axios({
            method: 'POST',
            url: spotifyTokenUrl,
            data: queryString.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
            },
        });
        accessToken = response.data.access_token;
        console.log('Access token refreshed:', accessToken);
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
};

app.get('/authenticated', (req, res) => {
    res.sendFile(__dirname + '/public/authenticated.html');
});
const getCurrentTrackFromSpotify = async () => {
    if (!accessToken) {
        console.log('No access token available.');
        return null;
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${accessToken}`,

            },
        });

        if (response.status === 204 || !response.data) return null;

        const trackData = {
            id: response.data.item.id,
            name: response.data.item.name,
            artist: response.data.item.artists.map(artist => artist.name).join(', '),
            album: response.data.item.album.name,
            albumImageUrl: response.data.item.album.images[0].url,
        };

        return trackData;
    } catch (error) {
        console.error('Error fetching track from Spotify:', error);
        return null;
    }
};

const broadcastToClients = (trackInfo) => {
    console.log('Broadcasting to clients:', trackInfo);
    ws.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(trackInfo));
        }
    });
};

const fetchAndBroadcastCurrentPlaying = async () => {
    const currentTrack = await getCurrentTrackFromSpotify();

    if (currentTrack && currentTrack.id !== lastTrackId) {
        lastTrackId = currentTrack.id;
        broadcastToClients(currentTrack);
    } else {
        console.log('No new track to broadcast or track is the same as the last one.');
    }
};

setInterval(fetchAndBroadcastCurrentPlaying, pollingInterval);
const tokenRefreshInterval = 3600000;

setInterval(refreshAccessToken, tokenRefreshInterval);

//Serve Static Files

app.use(express.static('public'));

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

