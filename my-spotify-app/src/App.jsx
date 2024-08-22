import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "../src/components/Login";
import Authenticated from "../src/components/Authenticated";
import Mock from "../src/components/Mock";
import HomePage from "../src/pages/HomePage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/authenticated" element={<Authenticated />} />
        <Route path="/authenticated-mock" element={<Mock />} />
      </Routes>
    </Router>
  );
};

export default App;
