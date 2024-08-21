import React from "react";
import weLogo from "../assets/WElogo.png";
import Login from "../components/Login";

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1
        className="text-2xl font-bold mb-4
      "
      >
        Welcome to the Home Page
      </h1>
      <img src={weLogo} alt="Logo" className="size-36" />
      <div>
        <Login />
      </div>
    </div>
  );
};

export default HomePage;
