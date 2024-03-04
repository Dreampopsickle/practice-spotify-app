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

// module.exports = { app };

//Import Middleware
const {
    session,
    cors,
    cookieParser} = require('./middleware/index');



// Create an HTTP server 
const server = http.createServer(app)
const ws = new WebSocket.Server({ server });

module.exports = { ws };


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

const { refreshToken } = require('./token');

//Refresh Token Route
const { refreshRoute } = require('./routes/refreshTokenRoute');

refreshRoute(app);

//Authenticated State Route
const { authStateRoute } = require('./routes/authStateRoute');

authStateRoute(app);

//Log out Route
const { logOutRoute } = require('./routes/logOutRoute');

logOutRoute(app);


//Setup Refresh Token Mechanism
const { refreshTokenIfNeeded } = require('./services/spotifyService');
setInterval(refreshTokenIfNeeded, 60000);


//Fetch and Broadcast Spotify Data
const { fetchAndBroadcastCurrentPlaying } = require('./services/spotifyTracks');

//WebSocket connection
ws.on('connection', function connection(ws) {
    console.log('A new client connected!');
    
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    fetchAndBroadcastCurrentPlaying();
});



//Serve Static Files
app.use(express.static('src'));

//Listen to Server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

