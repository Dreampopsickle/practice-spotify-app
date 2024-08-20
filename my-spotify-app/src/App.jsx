import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { Login, Authenticated } from "../src/components";
import HomePage from "../src/pages/HomePage";
import weLogo from "./assets/WElogo.png";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/authenticated" element={<Authenticated />} />
      </Routes>
    </Router>
  );
};

export default App;
