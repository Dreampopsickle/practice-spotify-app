require('dotenv').config();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const port = 5502;
let spotifyAccessToken = '';
let refreshToken;
let tokenExpirationTime = 0;

const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', function (ws) {
  console.log('A new client connected!');
  ws.send(JSON.stringify({ message: 'Hello from server' }));
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  ws.on('close', () => console.log('Client disconnected'));
});

app.use(cors());
app.use(express.json());

app.get('/login', (req, res) => {
  const scopes = 'user-read-currently-playing user-read-playback-state';
  res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}${scopes ? '&scope=' + encodeURIComponent(scopes) : ''}&redirect_uri=${encodeURIComponent('http://127.0.0.1:5501/public/index.html')}`);
});

app.post('/callback', function (req, res) {
  const code = req.body.code;
  if (!code) {
    return res.status(400).json({ error: 'Invalid or missing authorization code' });
  }
  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: 'http://127.0.0.1:5501/public/index.html',
    client_id: clientId,
    client_secret: clientSecret
  });
  makeTokenRequest(data, (error, response) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
    const { access_token, refresh_token } = response;
    spotifyAccessToken = access_token;
    refreshToken = refresh_token;
    tokenExpirationTime = Date.now() + 3600 * 1000;
    res.json({ access_token, refresh_token });
  });
});

function makeTokenRequest(data, callback) {
  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length
    }
  };
  const request = https.get(options, (response) => {
    let responseData = '';
    response.on('data', (chunk) => {
      responseData += chunk;
    });
    response.on('end', () => {
      const { access_token, refresh_token } = JSON.parse(responseData);
      callback(null, { access_token, refresh_token });
    });
  });
  request.on('error', (error) => {
    callback(error);
  });
  request.write(data);
  request.end();
}

app.get('/currently-playing', function (req, res) {
  refreshAccessTokenIfNeeded();
  const options = {
    hostname: 'api.spotify.com',
    path: '/v1/me/player/',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${spotifyAccessToken}`
    }
  };
  const request = https.get(options, (response) => {
    let responseData = '';
    response.on('data', (chunk) => {
      responseData += chunk;
    });
    response.on('end', () => {
      const data = JSON.parse(responseData);
      console.log("Spotify Response:", data);
      if (data && data.item) {
        const track = data.item;
        const trackInfo = {
          songName: track.name,
          artistName: track.artists.map(artist => artist.name).join(", "),
          albumName: track.album.name,
          albumCoverArt: track.album.images[0].url,
          songDuration: track.duration_ms,
          songProgress: data.progress_ms,
          playlistName: track.name
        };
        console.log('Sending Track Info:', trackInfo);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(trackInfo));
          }
        });
        res.json(trackInfo);
        console.log('Success');
      } else {
        res.status(204).send('No track is currently playing');
      }
    });
  });
  request.on('error', (error) => {
    console.error(error);
    res.status(500).send(error.message);
  });
  request.end();
});

function refreshAccessTokenIfNeeded() {
  const currentTime = Date.now();
  if (currentTime >= tokenExpirationTime - 60000) {
    refreshAccessToken();
  }
}

function refreshAccessToken() {
  const data = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  });
  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length
    }
  };
  const request = https.get(options, (response) => {
    let responseData = '';
    response.on('data', (chunk) => {
      responseData += chunk;
    });
    response.on('end', () => {
      const { access_token, refresh_token } = JSON.parse(responseData);
      spotifyAccessToken = access_token;
      if (refresh_token) {
        refreshToken = refresh_token;
      }
      tokenExpirationTime = Date.now() + 3600 * 1000;
    });
  });
  request.on('error', (error) => {
    console.error(error);
    refreshToken = null;
    tokenExpirationTime = 0;
  });
  request.write(data);
  request.end();
}

const server = app.listen(port, function listening() {
  console.log('Server listening on %d', server.address().port);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});