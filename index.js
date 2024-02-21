require('dotenv').config();
const express = require('express');
const session = require('express-session');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const queryString = require('querystring');
const crypto = require('crypto');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const path = require('path');

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
// const pollingInterval = 5000; // Poll every 5 seconds
let retryAfter = 0;
let cache = {
    data: null,
    expiry: null
};

// function isCacheValid() {
//     return cache.data && cache.expiry && new Date() < cache.expiry;
// };

const requestQueue = [];
const processQueue = () => {
    if (requestQueue.length === 0 || retryAfter > Date.now()) {
        return;
    }
    const requestFunction = requestQueue.shift();
    requestFunction().finally(processQueue);
        
};



//Spotify OAuth URLs
const spotifyAuthUrl = 'https://accounts.spotify.com/authorize';
const spotifyTokenUrl = 'https://accounts.spotify.com/api/token';

const generateRandomString = (length) => {
    return crypto
    .randomBytes(60)
    .toString('hex')
    .slice(0, length);
};
const stateKey = 'spotify_auth_state';

let accessTokenExpiry = 0;

function setCache(key, data, ttl) {
    const now = new Date().getTime();
    const expires = now + ttl;
    cache[key] = { data, expires };
}

function getCache(key) {
    const item = cache[key];
    if (item && item.expires > new Date().getTime()) {
        return item.data
    }
    return null;
}

if (!clientId || !clientSecret) {
    console.error('Spotify client ID or secret is not set. Check your environmental variables!'); // check for ID and secret
    process.exit(1);
};
const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Generated Secret Key:', secretKey);

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'src')))
    .use(cors())
    .use(cookieParser());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

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
});



app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    console.log(code);
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        
        res.redirect('/#' + queryString.stringify({ error: 'state_mismatch'}));
        return;

    } 
    
    res.clearCookie(stateKey);

    try {
        const tokenResponse = await axios.post(spotifyTokenUrl, queryString.stringify({
            code: code, 
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' +  Buffer.from(clientId + ':' + clientSecret).toString('base64')  
            }
        });
        console.log(tokenResponse.data);
        accessToken = tokenResponse.data.access_token;
        console.log('Retrieved Access Token:', accessToken);
        refreshToken = tokenResponse.data.refresh_token;
        console.log('Retrieved Refresh Token:', refreshToken);
        accessTokenExpiry = tokenResponse.data.expires_in * 1000 + Date.now();
        console.log('Retrieved Token expiry', accessTokenExpiry);
        
        
        req.session.accessToken = accessToken
        setAccessToken(accessToken, accessTokenExpiry);

        
        res.redirect('/authenticated')

    } catch (error) {
        console.error('Error in token exchange or fetching user details:', error);
        res.redirect('/#' + queryString.stringify({ error: 'invalid_token'}));
    }
});


app.get('/refresh_token', async (req, res) => {

    const currentRefreshToken = req.query.refresh_token || refreshToken;

    try {
        const response = await axios.post(spotifyTokenUrl, queryString.stringify({
            grant_type: 'refresh_token',
            refresh_token: currentRefreshToken
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            }
        });

        //Update access token and refresh token
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token || refreshToken;
        

        res.send({
            'access_token': accessToken,
            'refresh_token': refreshToken
        });
    
    
    } catch (error) {
        console.error('Error during token refresh', error);
        res.status(500).send('Internal Server Error');
    }
});




app.get('/authenticated', (req, res) => {
    res.redirect('/authenticated.html');
});

app.get('/logout', (req, res) => {
    req.session.user = null;
    req.session.destroy((err) => {
        
        if (err) {
            console.log('Error destroying session during logout', err)
            res.status(500).send("Error logging out");
        } 

        res.clearCookie('connect.sid');

        res.redirect('/login.html');
    
    });
});





function setAccessToken(token, expiresIn) {
    accessToken = token;
    accessTokenExpiry = Date.now() + expiresIn * 1000; // expiresIn is in seconds
};

async function refreshAccessToken() {
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

async function refreshTokenIfNeeded() {
    if (Date.now() > accessTokenExpiry) {
        await refreshAccessToken();
    }
}


// setAccessToken(accessToken, accessTokenExpiry);
setInterval(refreshTokenIfNeeded, 60000);

// const CACHE_TTL = 30000;



const getCurrentTrackFromSpotify = async (callback) => {

    const cacheKey = 'current_track';
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        console.log('Serving from cache');
        return cachedData;
    }

    if (!accessToken) {
        console.log('No access token available.');
        return null;
    }

    if (retryAfter > Date.now()) {
        console.log('Rate limit in effect. Waiting before new requests...');
        return null;
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${accessToken}`,

            },
        });

        if (response.status === 204 || !response.data) {
            return null;
        }; 

        const trackData = {
            id: response.data.item.id,
            name: response.data.item.name,
            artist: response.data.item.artists.map(artist => artist.name).join(', '),
            album: response.data.item.album.name,
            albumImageUrl: response.data.item.album.images[0].url,
            isPlaying: response.data.is_playing,
            trackDuration: response.data.item.duration_ms,
            trackProgress: response.data.progress_ms,


        };
        
        cache.data = trackData;
        cache.expiry = new Date(new Date().getTime() + 5 * 60 * 1000);
        const fixedCacheDuration = 120 * 1000;
        setCache(cacheKey, trackData, fixedCacheDuration);
        callback(trackData);
        return trackData;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            retryAfterHeader = error.response.headers['retry-after'];
            const retryAfterMs = (parseInt(retryAfterHeader, 10) || 1) * 1000;
            
            // console.log(`Rate limited. Retrying after ${retryAfterMs} milliseconds.`);
            retryAfter = Date.now() + retryAfterMs;
            
            setTimeout(getCurrentTrackFromSpotify, retryAfterMs);
        } else {
            console.error('Error fetching track from Spotify:', error);
            // return null;
        }
        
        
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


async function fetchAndBroadcastCurrentPlaying() {

    if (retryAfter > Date.now()) {
        console.log('Rate limit in effect. Skipping fetch');
        scheduleNextFetch();
        return;
    }
     const handletrackData = (currentTrack) => {
        if (currentTrack && currentTrack.id !== lastTrackId) {
            lastTrackId = currentTrack.id;
            broadcastToClients(currentTrack)
        } else {
            console.log('No track is currently playing or track as not changed');
        } 
     };
    requestQueue.push(() => getCurrentTrackFromSpotify(handletrackData));
    processQueue();
    scheduleNextFetch();
}
    
    




function scheduleNextFetch() {
    const interval = 60000;
    setTimeout(fetchAndBroadcastCurrentPlaying, interval);
}

ws.on('connection', function connection(ws) {
    console.log('A new client connected!');
    
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    fetchAndBroadcastCurrentPlaying();
});



//Serve Static Files

app.use(express.static('public'));

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

