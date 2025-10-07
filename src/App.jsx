import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Lineal from "./pages/Lineal.jsx";
import Multiplicativo from "./pages/Multiplicativo.jsx";
import Ejercicios from "./pages/Ejercicios";
import DepositoFijo from "./pages/ejercicios/DepositoFijo";
import DepositoVariable from "./pages/ejercicios/DepositoVariable";
import Dados from "./pages/ejercicios/Dados";
import Tienda from "./pages/ejercicios/Tienda";
import Gallina from "./pages/ejercicios/Gallina";
import Azucar from "./pages/ejercicios/Azucar";



export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lineal" element={<Lineal />} />
          <Route path="/multiplicativo" element={<Multiplicativo />} />
          <Route path="/ejercicios" element={<Ejercicios />} />
          <Route path="/ejercicios/DepositoFijo" element={<DepositoFijo />} />
          <Route path="/ejercicios/DepositoVariable" element={<DepositoVariable />} />
          <Route path="/ejercicios/Dados" element={<Dados />} />
          <Route path="/ejercicios/Tienda" element={<Tienda />} />
          <Route path="/ejercicios/Gallina" element={<Gallina />} />
          <Route path="/ejercicios/Azucar" element={<Azucar />} />



        

        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} SIS-216</footer>
    </>
  );
}
