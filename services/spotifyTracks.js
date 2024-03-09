const { getAccessToken } = require("../token/tokenManager");

let lastTrackId = null; // Store the ID of the last track played
let retryAfter = 0;

let cache = {
  data: null,
  expiry: null,
};

const requestQueue = [];

const getCurrentTrackFromSpotify = async (callback, dependencies) => {
  const { axios } = dependencies;

  const accessToken = getAccessToken();

  const cacheKey = "current_track";
  const cachedData = getCache(cacheKey);

  if (!accessToken) {
    console.log("No access token available.");
    return null;
  }

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
    callback(trackData);
    return trackData;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      retryAfterHeader = error.response.headers["retry-after"];
      const retryAfterMs = (parseInt(retryAfterHeader, 10) || 1) * 1000;

      // console.log(`Rate limited. Retrying after ${retryAfterMs} milliseconds.`);
      retryAfter = Date.now() + retryAfterMs;

      setTimeout(
        () => getCurrentTrackFromSpotify(callback, dependencies, wsInstance),
        retryAfterMs
      );
    } else {
      console.error("Error fetching track from Spotify:", error);
      // return null;
    }
  }
};

const broadcastToClients = (trackInfo, ws) => {
  if (!ws || !ws.clients) {
    console.error("WebSocket instance or clients are undefined.");
    return;
  }
  console.log("wsInstance in broadcastToClients:", wsInstance);
  console.log("Broadcasting to clients:", trackInfo);

  ws.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(trackInfo));
    }
  });
};

const fetchAndBroadcastCurrentPlaying = async (dependencies, options) => {
  // console.log("Options passed in: ", options);
  // const { ws } = options;
  if (retryAfter > Date.now()) {
    console.log("Rate limit in effect. Skipping fetch");
    scheduleNextFetch(dependencies, options);
    return;
  }
  const socket = options;
  const trackData = await getCurrentTrackFromSpotify(dependencies);
  // console.log("What is in socket?: ", socket);
  // getCurrentTrackFromSpotify(callback, dependencies);
  handletrackData(trackData, socket);
  requestQueue.push(() =>
    getCurrentTrackFromSpotify(handletrackData, dependencies)
  );
  processQueue();
  scheduleNextFetch(dependencies, options);
};

const handletrackData = (currentTrack, socketServer) => {
  if (currentTrack && currentTrack.id !== lastTrackId) {
    lastTrackId = currentTrack.id;
    broadcastToClients(currentTrack, socketServer);
  } else {
    console.log("No track is currently playing or track has not changed");
  }
};

const scheduleNextFetch = (dependencies, ws) => {
  const interval = 60000;
  setTimeout(() => fetchAndBroadcastCurrentPlaying(dependencies, ws), interval);
};

const processQueue = () => {
  if (requestQueue.length === 0 || retryAfter > Date.now()) {
    return;
  }
  const requestFunction = requestQueue.shift();
  requestFunction().finally(processQueue);
};

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

module.exports = { fetchAndBroadcastCurrentPlaying };
