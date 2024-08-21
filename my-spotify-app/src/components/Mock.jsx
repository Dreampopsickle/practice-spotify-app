import React from "react";
import albumArt from "../assets/album-art.jpeg";

const Mock = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <img
        id="albumCover"
        src={albumArt}
        alt="Album Art"
        className="w-album-cover-sm h-album-cover-sm md:w-album-cover-md md:h-album-cover-md lg:w-album-cover-lg lg:h-album-cover-lg mb-5"
      />
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Serenade of Water</h2>
        <p className="text-lg text-gray-300 mb-1">Artist: Men I Trust</p>
        <p className="text-md text-gray-400">Album: Untourable Album</p>
      </div>
    </div>
  );
};

export default Mock;
