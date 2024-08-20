import React from "react";
import { Link } from "react-router-dom";
import weLogo from "../assets/WElogo.png";

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <img src={weLogo} alt="Logo" className="size-36" />
      <nav>
        <Link to="/login">Login</Link>
      </nav>
    </div>
  );
};

export default HomePage;
