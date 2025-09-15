import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Lineal from "./pages/Lineal.jsx";
import Multiplicativo from "./pages/Multiplicativo.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lineal" element={<Lineal />} />
          <Route path="/multiplicativo" element={<Multiplicativo />} />
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} SIS-216</footer>
    </>
  );
}
