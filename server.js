// Import Config
const {
    express,
    http,
    fs,
    WebSocket,
    queryString,
    crypto,
    axios,
    path,
    clientId,
    clientSecret,
    redirectUri,
    port
} = require('./config/index');

// Initialize Express app
const app = express();

module.exports = { app };

//Import Middleware
const {
    session,
    cors,
    cookieParser} = require('./middleware/index');



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
module.exports = { secretKey };

//Session Configuration
const { sessionConfig } = require('./config/sessionConfig');

sessionConfig(app, secretKey);

// Middleware Setup
const { setupMiddleWare } = require('./middleware/middlewareSetup')

setupMiddleWare(app);


//Serve the login page
const { serveLoginPage } = require('./routes/serveLogin');

serveLoginPage(app);

//Login route
const { loginRoute } = require('./routes/loginRoute');

loginRoute(app);

//Callback Route
const { callbackRoute } = require('./routes/callbackRoute');

callbackRoute(app);

//Refresh Token Route
const { refreshRoute } = require('./routes/refreshTokenRoute');

refreshRoute(app);

//Authenticated State Route
const { authStateRoute } = require('./routes/authStateRoute');

authStateRoute(app);

//Log out Route
const { logOutRoute } = require('./routes/logOutRoute');

logOutRoute(app);







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

app.use(express.static('src'));

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

