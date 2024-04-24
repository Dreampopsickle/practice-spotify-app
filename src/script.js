// Initialize login process and WebSocket connection on successful login
const onLoginSuccess = () => {
  localStorage.setItem("isLoggedIn", "true"); // Flag to indicated login status
  connectWebSocket(); // Establish WebSocket connection for real-time updates
};

let lastTrackId = localStorage.getItem("lastTrackId"); // Retrieve the last track ID

// Establish WebSocket connection and handle incoming messages
const connectWebSocket = () => {
  const isProduction = window.location.hostname !== "localhost";
  const host = isProduction
    ? "wss://practice-spotify-app.onrender.com"
    : "ws://localhost:5502"; // toggles between prod and dev
  const socket = new WebSocket(host);

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
    trackCover.loading = "lazy";
    trackCover.src = trackInfo.albumImageUrl;
    trackCover.className =
      "w-album-cover-sm h-album-cover-sm md:w-album-cover-md md:h-album-cover-md lg:w-album-cover-lg lg:h-album-cover-lg";
  } else {
    trackInfoDiv.innerHTML = "<p>No track is currently playing.</p>";
  }
};

// Initialize UI and WebSocket connection if the user is already logged in
const initializeApp = () => {
  fetch("/api/isAuthenticated")
    .then((response) => response.json())
    .then((data) => {
      if (data.isAuthenticated) {
        console.log("User is authenticated");
        onLoginSuccess();
        const savedTrackInfo = localStorage.getItem("trackInfo");
        if (savedTrackInfo) {
          updateTrackInfoUI(JSON.parse(savedTrackInfo));
        } else {
          console.log("User is not authenticated");
          //Prompt user to log in
        }
      }
    })
    .catch((error) => console.error("Error checking authentication", error));
};

document.addEventListener("DOMContentLoaded", initializeApp);
window.onbeforeunload = function () {
  socket.close();
};

// function logOut() {
//     localStorage.removeItem('isLoggedIn');
//     localStorage.removeItem('lastTrackId');
//     localStorage.removeItem('trackInfo');
//     window.location.href = 'http://localhost:5502/logout';
// };
