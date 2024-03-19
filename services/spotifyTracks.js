// Dependencies and State Management
let lastTrackId = null; // Store the ID of the last track played
let retryAfter = 0;
let cache = {
  data: null,
  expiry: null,
};

//Utility functions for cache management
const setCache = (key, data, ttl) => {
  const now = new Date().getTime();
  const expires = now + ttl;
  cache[key] = { data, expires };
};

const getCache = (key) => {
  const item = cache[key];
  if (item && item.expires > new Date().getTime()) {
    return item.data;
  }
  return null;
};

//Main Functionality
const getCurrentTrackFromSpotify = async (dependencies) => {
  const { axios, tokenManager } = dependencies;
  const accessToken = await tokenManager.getAccessToken();
  if (!accessToken) {
    console.log("No access token available.");
    return null;
  }

  const cacheKey = "current_track";
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    console.log("Serving from cache");
    return cachedData;
  }

  if (retryAfter > Date.now()) {
    console.log("Rate limit in effect. Waiting before new requests...");
    return null;
  }

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 204 || !response.data) {
      return null;
    }

    const trackData = {
      id: response.data.item.id,
      name: response.data.item.name,
      artist: response.data.item.artists
        .map((artist) => artist.name)
        .join(", "),
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
    return trackData;
  } catch (error) {
    handleErrors(error);
  }
};

const fetchAndBroadcastCurrentPlaying = async (dependencies, ws) => {
  if (retryAfter > Date.now()) {
    console.log("Rate limit in effect. Skipping fetch");
    scheduleNextFetch(dependencies, ws);
    return;
  }

  const trackData = await getCurrentTrackFromSpotify(dependencies);
  if (trackData && ws) {
    handletrackData(trackData, ws);
  }
  requestQueue.push(() => getCurrentTrackFromSpotify(dependencies));
  processQueue();
  scheduleNextFetch(dependencies, ws);
};

//Broadcasting and data handling
const broadcastToClients = (trackInfo, ws) => {
  if (!ws || !ws.clients) {
    console.error("WebSocket instance or clients are undefined.");
    return;
  }
  console.log("Websocket clients available: ", ws.clients.size);
  console.log("Broadcasting to clients:", trackInfo);

  ws.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(trackInfo));
    }
  });
};

const handletrackData = (currentTrack, ws) => {
  if (currentTrack && currentTrack.id !== lastTrackId) {
    lastTrackId = currentTrack.id;
    broadcastToClients(currentTrack, ws);
  } else {
    console.log("No track is currently playing or track has not changed");
  }
};

//Scheduling and queue management

const scheduleNextFetch = (dependencies, ws) => {
  const interval = 60000;
  setTimeout(() => fetchAndBroadcastCurrentPlaying(dependencies, ws), interval);
};
const requestQueue = [];
const processQueue = () => {
  if (requestQueue.length === 0 || retryAfter > Date.now()) {
    return;
  }
  const requestFunction = requestQueue.shift();
  requestFunction().finally(processQueue);
};

//Error handling
const handleErrors = (error) => {
  if (error.response && error.response.status === 429) {
    retryAfterHeader = error.response.headers["retry-after"];
    const retryAfterMs = (parseInt(retryAfterHeader, 10) || 1) * 1000;
    retryAfter = Date.now() + retryAfterMs;

    setTimeout(() => getCurrentTrackFromSpotify(dependencies), retryAfterMs);
  } else {
    console.error("Error fetching track from Spotify:", error);
    return null;
  }
};

module.exports = { fetchAndBroadcastCurrentPlaying };
