import React from "react";
import { Link } from "react-router-dom";

const Login = () => {
  const handleLogin = () => {
    const baseURL = window.location.origin;
    window.location.href = `${baseURL}/login`;
    console.log("login triggered");
  };

  return (
    <div className="flex flex-row justify-center my-5">
      <h1>Login to your Spotify Account</h1>
      <button
        onClick={handleLogin}
        className="bg-green-500 text-gray-50 dark:bg-gray-50 transition duration-100 dark:text-gray-900 px-8 text-lg shadow-md py-2 rounded-lg hover:shadow-xl"
      >
        Login
      </button>
      <Link to="/">Home</Link>
    </div>
  );
};

export default Login;
