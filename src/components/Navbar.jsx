import React from "react";
import { Link, NavLink } from "react-router-dom";

const DisabledTab = ({ children }) => {
  const onClick = (e) => e.preventDefault();
  return (
    <a href="#" onClick={onClick} className="nav-link disabled" aria-disabled="true" title="Próximamente">
      {children}
    </a>
  );
};

export default function Navbar() {
  return (
    <header className="nav">
      {/* Columna izquierda */}
      <nav className="nav-group left">
        <NavLink to="/lineal" className="nav-link">Lineal</NavLink>
        <NavLink to="/multiplicativo" className="nav-link">Multiplicativo</NavLink>
      </nav>

      {/* Columna central (badge) */}
      <div className="brand">
        <Link to="/" className="brand-link">SIS-216</Link>
      </div>

      {/* Columna derecha */}
      <nav className="nav-group right">
        <NavLink to="/ejercicios" className="nav-link">Ejercicios de simulacion</NavLink>
        <DisabledTab>Algoritmos</DisabledTab>
      </nav>
    </header>
  );
}
