import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Authenticated = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trackInfo, setTrackInfo] = useState(null);
  const [lastTrackId, setLastTrackId] = useState(
    localStorage.getItem("lastTrackId")
  );

  const navigate = useNavigate();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await fetch("/api/isAuthenticated");
        const data = await response.json();

        if (data.isAuthenticated) {
          console.log("User is authenticated");
          onLoginSuccess();
          const savedTrackInfo = localStorage.getItem("trackInfo");
          if (savedTrackInfo) {
            updateTrackInfoUI(JSON.parse(savedTrackInfo));
          }
        } else {
          console.log("User is not authenticated");
        }
      } catch (error) {
        console.error("Error checking authentication", error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    let socket;
    if (isLoggedIn) {
      socket = connectWebSocket();
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [isLoggedIn]);

  const onLoginSuccess = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const connectWebSocket = () => {
    const isProduction = window.location.hostname !== "localhost";
    const host = isProduction
      ? "wss://practice-spotify-app.onrender.com"
      : "ws://localhost:5502";

    const socket = new WebSocket(host);

    socket.onopen = (event) => {
      console.log("WebSocket connection established", event);
    };

    socket.onmessage = (event) => {
      console.log("Data received:", event.data);
      const trackInfo = JSON.parse(event.data);
      console.log("Track info received:", trackInfo);

      if (trackInfo.id !== lastTrackId) {
        setLastTrackId(trackInfo.id);
        localStorage.setItem("trackInfo", JSON.stringify(trackInfo));
        localStorage.setItem("lastTrackId", trackInfo.id);
        updateTrackInfoUI(trackInfo);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socket.onclose = (event) => {
      console.log("WebSocket disconnected, attempting to reconnect...");
      setTimeout(connectWebSocket, 5000);
    };

    return socket;
  };

  const updateTrackInfoUI = (trackInfo) => {
    setTrackInfo(trackInfo);
  };

  const handleLogOut = () => {
    const baseURL = window.location.origin;
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("lastTrackId");
    localStorage.removeItem("trackInfo");
    window.location.href = `${baseURL}/login`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      {trackInfo ? (
        <div id="trackInfo" className="text-center">
          <img
            id="albumCover"
            loading="lazy"
            src={trackInfo.albumImageUrl}
            className="w-album-cover-sm h-album-cover-sm md:w-album-cover-md md:h-album-cover-md lg:w-album-cover-lg lg:h-album-cover-lg mb-10"
            alt="Album cover"
          />
          <h2 id="trackName" className="text-2xl font-semibold mb-2">
            Track: {trackInfo.name}
          </h2>
          <p id="artistName" className="text-lg text-gray-400 mb-1">
            Artist: {trackInfo.artist}
          </p>
          <p id="albumName" className="text-md text-gray-500">
            Album: {trackInfo.album}
          </p>
        </div>
      ) : (
        <p className="text-lg">No track is currently playing.</p>
      )}
      {isLoggedIn && (
        <button
          onClick={handleLogOut}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Log Out
        </button>
      )}
    </div>
  );
};

export default Authenticated;
