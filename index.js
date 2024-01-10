require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const queryString = require('querystring');
const axios = require('axios');
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const port = process.env.PORT || 3000;

// Initialize Express app
const app = express();

// Create an HTTPS server with self-signed certificate (for local testing)
const server = https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app);
const wss = new WebSocket.Server({ server });

let accessToken = ''; // Access token for Spotify API
let lastTrackId = null; // Store the ID of the last track played
const pollingInterval = 5000; // Poll every 5 seconds

//Spotify OAuth URLs
const spotifyAuthUrl = 'https://accounts.spotify.com/authorize';
const spotifyTokenUrl = 'https://accounts.spotify.com/api/token';

app.get('/login', (req, res) => {
    const queryParams = queryString.stringify({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'user-read-currently-playing user-read-playback-state',
    });
    res.redirect(`${spotifyAuthUrl}?${queryParams}`);
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
        res.redirect('/'); // Redirect to the main page after successful
    } catch (error) {
        res.status(500).send('Authentication Failed');
    }
});

const getCurrentTrackFromSpotify = async () => {
    if (!accessToken) return null;

    try {
        const response = await axios.get('https://api.spotify.com/v1/plaer/currently-playing', {
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
    wss.clients.forEach(client => {
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
    }
};

setInterval(fetchAndBroadcastCurrentPlaying, pollingInterval);

//Serve Static Files

app.use(express.static('public'));

server.listen(port, () => {
    console.log(`Server is running on https://localhost:${port}`);
});

