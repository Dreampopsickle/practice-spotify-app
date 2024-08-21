import React from "react";

const Mock = () => {
  return (
    <div className="track-info">
      <img
        src="../assets/album-art.jpeg"
        alt="Album Art"
        className="album-art"
      />
      <div className="track-details">
        <h2 className="track-title">Track: Serenade of Water</h2>
        <p className="track-artist">Artist: Men I Trust</p>
        <p className="track-album">Album: Untourable Album</p>
      </div>
    </div>
  );
};

export default Mock;
