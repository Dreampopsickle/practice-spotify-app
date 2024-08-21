import React from "react";
import { Link } from "react-router-dom";

const Login = () => {
  const handleLogin = () => {
    const isDevelopment = process.env.NODE_ENV === "development";
    const loginURL = isDevelopment
      ? `${window.location.origin}/mock-login.html`
      : `${window.location.origin}/login`;
    window.location.href = loginURL;
    console.log("login triggered, redirecting to:", loginURL);
  };

  return (
    <div className="flex flex-col">
      <h1>Login to your Spotify Account</h1>
      <button
        onClick={handleLogin}
        className="bg-green-500 text-gray-50 dark:bg-gray-50 transition duration-100 dark:text-gray-900 px-8 text-lg shadow-md py-2 rounded-lg hover:shadow-xl"
      >
        Login
      </button>
    </div>
  );
};

export default Login;
