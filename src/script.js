const onLoginSuccess = () => {
  localStorage.setItem("isLoggedIn", "true");
  connectWebSocket();
};

let lastTrackId = localStorage.getItem("lastTrackId");
// let dotenv = require("dotenv");

localStorage.setItem("isLoggedIn", "true");

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
const connectWebSocket = () => {
  const socket = new WebSocket(`wss://practice-spotify-app.onrender.com`);
  // const socket = new WebSocket(`ws://localhost:5502`);

  socket.onopen = function (event) {
    console.log("WebSocket connection established", event);
  };

  socket.onmessage = (event) => {
    console.log("Data received:", event.data);
    const trackInfo = JSON.parse(event.data);
    console.log("Track info recieved:", trackInfo);
    if (trackInfo.id !== lastTrackId) {
      lastTrackId = trackInfo.id;
      localStorage.setItem("lastTrackId", trackInfo.id);
      localStorage.setItem("trackInfo", JSON.stringify(trackInfo));
      updateTrackInfoUI(trackInfo);
    }

    if (data.sessionExpired) {
      alert("Session expired Please log in again.");
      window.location.href = "/login.html";
    }
  };

  socket.onerror = function (error) {
    console.error("WebSocket Error:", error);
  };

  socket.onclose = function (event) {
    console.log("WebSocket disconnected, attempting to reconnect...");
    setTimeout(connectWebSocket, 5000);
  };
};

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
  } else {
    trackInfoDiv.innerHTML = "<p>No track is currently playing.</p>";
  }
};

if (localStorage.getItem("isLoggedIn") === "true") {
  console.log("User is authenticated");
  onLoginSuccess();
  const savedTrackInfo = localStorage.getItem("trackInfo");
  if (savedTrackInfo) {
    updateTrackInfoUI(JSON.parse(savedTrackInfo));
  }
} else {
  console.log("User is not authenticated");
  //Promt for login to-do
}

// function logOut() {
//     localStorage.removeItem('isLoggedIn');
//     localStorage.removeItem('lastTrackId');
//     localStorage.removeItem('trackInfo');
//     window.location.href = 'http://localhost:5502/logout';
// };
