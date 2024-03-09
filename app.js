// -----------------------------------------------
// Libraries we need
const express = require("express");
const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");
const queryString = require("querystring");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");

/// Import Middleware
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");

/// Need for getting info out of .env files
let dotenv = require("dotenv");

// --------------------------------------------------
// Get our Environment variables out of the .env file
dotenv.config(); // put what we find into the process.env
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const port = process.env.PORT || 3000;

// These are constants so we'll just put them here too
const spotifyAuthUrl = "https://accounts.spotify.com/authorize";
const spotifyTokenUrl = "https://accounts.spotify.com/api/token";
const stateKey = "spotify_auth_state";

//We're going to pass this to all our routes, probably
let routeDependencies = {
  clientId,
  clientSecret,
  redirectUri,
  port,
  spotifyAuthUrl,
  spotifyTokenUrl,
  stateKey,
  crypto,
  queryString,
  axios,
  path,
};

/// Make Sure that worked
if (!clientId || !clientSecret) {
  console.error(
    "Spotify client ID or secret is not set. Check your environmental variables!"
  ); // check for ID and secret
  process.exit(1);
}

// --------------------------------------------------------------------------------
// Set up the app

// We're using Express
const app = express();

// Create an HTTP Server and a WebSocket to listen with it
const server = http.createServer(app);
const ws = new WebSocket.Server({ server });

// ----------------------------------------------------------------
//Generate a secret key to sign the session ID cookie
const secretKey = crypto.randomBytes(32).toString("hex");
console.log("Generated Secret Key:", secretKey);

// ----------------------------------------------------------------
// Make the app only set up sessions using the secret key we just generated
app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// ----------------------------------------------------------------
// Middleware Setup
app
  .use(express.static(path.join(__dirname, "src"))) // look into the src dir for everything
  .use(cors())
  .use(cookieParser());

// ----------------------------------------------------------------
// We only want to serve static files
app.use(express.static("src"));

// ----------------------------------------------------------------
// Set up our routes

/// Handle when someone gits the root (/) of our web server
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "login.html"));
});

/// Handle (kenny) logins
const { loginRoute } = require("./routes/loginRoute");
app.get("/login", (req, res) => {
  loginRoute(req, res, routeDependencies);
});

// Callback Route
const { callbackRoute } = require("./routes/callbackRoute");
app.get("/callback", (req, res) => {
  callbackRoute(req, res, routeDependencies);
});

//Refresh Token Route
const { refreshRoute } = require("./routes/refreshTokenRoute");
app.get("/refresh_token", async (req, res) => {
  refreshRoute(req, res, routeDependencies);
});

//Authenticated State Route
const { authStateRoute } = require("./routes/authStateRoute");
app.get("/authenticated", (req, res) => {
  authStateRoute(req, res, routeDependencies);
});

//Log out Route
const { logOutRoute } = require("./routes/logOutRoute");
app.get("/logout", (req, res) => {
  logOutRoute(req, res, routeDependencies);
});

// -------------------------------------------------------------------------
//Setup Refresh Token Mechanism
const { refreshTokenIfNeeded } = require("./services/spotifyService");
setInterval(() => refreshTokenIfNeeded(routeDependencies), 60000);

// -------------------------------------------------------------------------
//Fetch and Broadcast Spotify Data
const { fetchAndBroadcastCurrentPlaying } = require("./services/spotifyTracks");

// -------------------------------------------------------------------------
// Open a WebSocket
ws.on("connection", function connection(ws) {
  console.log("A new client connected!");

  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });
  fetchAndBroadcastCurrentPlaying(routeDependencies, ws);
});

// --------------------------------------------------------------------------
// Start it up
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
