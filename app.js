// -----------------------------------------------
// Import necessary libraries and modules
const express = require("express");
const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");
const queryString = require("querystring");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");

// Import custom Token Manager for handling Spotify API tokens
const TokenManager = require("./token/tokenManager");

/// Import Middleware for session management, CORS, and cookie parsing
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
const shopClientId = process.env.SPOTIFY_SHOP_CLIENT_ID;
const shopClientSecret = process.env.SPOTIFY_SHOP_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const port = process.env.PORT || 3000;

// Spotify API URLs and session state key
const spotifyAuthUrl = "https://accounts.spotify.com/authorize";
const spotifyTokenUrl = "https://accounts.spotify.com/api/token";
const stateKey = "spotify_auth_state";

// Initialize TokenManager with Spotify API details
const tokenManager = new TokenManager({
  clientId,
  clientSecret,
  shopClientId,
  shopClientSecret,
  spotifyTokenUrl,
  axios,
  queryString,
});

// Dependencies to be passed to route handlers
const routeDependencies = {
  clientId,
  clientSecret,
  shopClientId,
  shopClientSecret,
  redirectUri,
  port,
  spotifyAuthUrl,
  spotifyTokenUrl,
  stateKey,
  crypto,
  queryString,
  axios,
  path,
  tokenManager,
};

/// Verify that Spotify client ID and secret are set
if (!shopClientId || !shopClientSecret) {
  console.error(
    "Spotify client ID or secret is not set. Check your environmental variables!"
  ); // check for ID and secret
  process.exit(1);
}

// --------------------------------------------------------------------------------
// Set up the app

// Initialize Express App
const app = express();

// Create an HTTP Server and a WebSocket to listen with it
const server = http.createServer(app);
const ws = new WebSocket.Server({ server });

// ----------------------------------------------------------------
//Generate a secret key to sign the session ID cookie
const secretKey = crypto.randomBytes(32).toString("hex");
console.log("Generated Secret Key:", secretKey);

// ----------------------------------------------------------------
// Configure session management for Express
app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Should be true in production with HTTPS
  })
);

// ----------------------------------------------------------------
// Apply middleware for CORS, cookie parsing and serving static files
app
  .use(express.static(path.join(__dirname, "src"))) // look into the src dir for everything
  .use(cors())
  .use(cookieParser());

// ----------------------------------------------------------------
// We only want to serve static files
app.use(express.static("src"));

// ----------------------------------------------------------------
// Set up our routes

/// Handle when someone gets the root (/) of our web server
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
setInterval(() => refreshTokenIfNeeded(routeDependencies), 60000); // Periodically refresh Spotify tokens

// -------------------------------------------------------------------------
//Fetch and Broadcast Spotify Data
const { fetchAndBroadcastCurrentPlaying } = require("./services/spotifyTracks");

// -------------------------------------------------------------------------
// Open a WebSocket
ws.on("connection", function connection(client) {
  console.log("A new client connected!");

  client.on("message", function incoming(message) {
    console.log("received: %s", message);
  });
  fetchAndBroadcastCurrentPlaying(routeDependencies, ws);
  // console.log("Route Dependencies:", routeDependencies);
});

// --------------------------------------------------------------------------
// Start it up
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
