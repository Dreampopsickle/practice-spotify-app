// Initialize login process and WebSocket connection on successful login
const onLoginSuccess = () => {
  localStorage.setItem("isLoggedIn", "true"); // Flag to indicated login status
  connectWebSocket(); // Establish WebSocket connection for real-time updates
};

let lastTrackId = localStorage.getItem("lastTrackId"); // Retrieve the last track ID
// let dotenv = require("dotenv");

// localStorage.setItem("isLoggedIn", "true");

// dotenv.config();
// const localLogin = process.env.LOCALHOST_LOGIN;
// const renderLogin = process.env.RENDERHOST_LOGIN;
// if (localLogin) {
//   const socket = new WebSocket(`ws://${localLogin}`); // This is temporary, remember to refactor for Render hosting
//   connectWebSocket(socket);
// } else if (renderLogin) {
//   const socket = new WebSocket(`wss://${localLogin}`);
//   connectWebSocket(socket);
// }

// Establish WebSocket connection and handle incoming messages
const connectWebSocket = () => {
  const socket = new WebSocket(`wss://practice-spotify-app.onrender.com`);
  // const socket = new WebSocket(`ws://localhost:5502`);

  socket.onopen = function (event) {
    console.log("WebSocket connection established", event);
  };

  socket.onmessage = (event) => {
    console.log("Data received:", event.data);
    const trackInfo = JSON.parse(event.data); // Parse incoming track data
    console.log("Track info recieved:", trackInfo);

    // Update UI and local storage if new track information is received
    if (trackInfo.id !== lastTrackId) {
      // to-do: clean up
      lastTrackId = trackInfo.id;
      localStorage.setItem("trackInfo", JSON.stringify(trackInfo));
      localStorage.setItem("lastTrackId", trackInfo.id);
      updateTrackInfoUI(trackInfo);
    }

    // Redirect ti login page if session expired
    if (trackInfo.sessionExpired) {
      alert("Session expired Please log in again.");
      window.location.href = "/login.html";
    }
  };

  socket.onerror = function (error) {
    console.error("WebSocket Error:", error);
  };

  socket.onclose = function (event) {
    console.log("WebSocket disconnected, attempting to reconnect...");
    setTimeout(connectWebSocket, 5000); // Attempt to reconnect after 5 seconds
  };
};

// Update UI elements with the current track information
const updateTrackInfoUI = (trackInfo) => {
  const trackInfoDiv = document.getElementById("trackInfo");
  const trackName = document.getElementById("trackName");
  const trackArtist = document.getElementById("artistName");
  const trackAlbum = document.getElementById("albumName");
  const trackCover = document.getElementById("albumCover");

  if (trackInfo && trackInfoDiv) {
    trackName.textContent = "Track: " + trackInfo.name;
    trackArtist.textContent = "Artist: " + trackInfo.artist;
    trackAlbum.textContent = "Album: " + trackInfo.album;
    trackCover.src = trackInfo.albumImageUrl;
    trackCover.className =
      "w-album-cover-sm h-album-cover-sm md:w-album-cover-md md:h-album-cover-md lg:w-album-cover-lg lg:h-album-cover-lg";
  } else {
    trackInfoDiv.innerHTML = "<p>No track is currently playing.</p>";
  }
};

// Initialize UI and WebSocket connection if the user is already logged in
if (localStorage.getItem("isLoggedIn") === "true") {
  console.log("User is authenticated");
  onLoginSuccess();
  const savedTrackInfo = localStorage.getItem("trackInfo");
  if (savedTrackInfo) {
    updateTrackInfoUI(JSON.parse(savedTrackInfo));
  }
} else {
  console.log("User is not authenticated");
  //Prompt user to log in
}
window.onbeforeunload = function () {
  socket.close();
};

// function logOut() {
//     localStorage.removeItem('isLoggedIn');
//     localStorage.removeItem('lastTrackId');
//     localStorage.removeItem('trackInfo');
//     window.location.href = 'http://localhost:5502/logout';
// };
