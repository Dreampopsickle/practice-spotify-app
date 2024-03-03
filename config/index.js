const express = require('express');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const queryString = require('querystring');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
require('dotenv').config();
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const port = process.env.PORT || 3000;

module.exports = {
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
};