import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1 className="hero-title">Aleatoriedad</h1>
        <p className="hero-sub">Plataforma educativa de algoritmos pseudoaleatorios</p>
      </section>

      {/* Sección contextual de la página */}
      <section className="about">
        <h2>¿Qué son los algoritmos aleatorios?</h2>
        <p>
          En esta plataforma exploraremos cómo generar secuencias <em>pseudoaleatorias</em> usando
          métodos deterministas. Comenzaremos con dos clásicos: el
          <strong> Método Congruencial Lineal (MCL)</strong> y el
          <strong> Método Congruencial Multiplicativo (MCM)</strong>, y
          más adelante añadiremos <strong>dos algoritmos adicionales</strong> para completar un
          conjunto de <strong>cuatro</strong>. El objetivo es entender su teoría, practicar con
          ejemplos y visualizar resultados paso a paso.
        </p>
      </section>

      {/* CONTENIDO / PASTILLAS */}
      <section className="portfolio-intro">
        <h2>Contenido</h2>
        <ul className="pill-list">
          <li><a className="pill-link" href="#intro">Introducción</a></li>
          <li><a className="pill-link" href="#mcl">Método Congruencial Lineal</a></li>
          <li><a className="pill-link" href="#mcm">Método Congruencial Multiplicativo</a></li>
          <li>Próximamente: más algoritmos</li>
        </ul>
      </section>

      {/* SECCIÓN: INTRODUCCIÓN (imágenes 1–4) con acento turquesa */}
      <section id="intro" className="page-shell accent-turquoise">
        <h2 className="title-pill turquoise">Introducción</h2>

        <h3 className="subhead turquoise">Números aleatorios y pseudoaleatorios</h3>
        <ul>
          <li>
            En simulación, las observaciones <em>r₁, r₂, …, rₙ</em> de una distribución uniforme
            en el intervalo <strong>(0, 1)</strong> se consideran números aleatorios.
          </li>
          <li>
            En la práctica se emplean <strong>números pseudoaleatorios</strong>:
            secuencias generadas por métodos deterministas que imitan el comportamiento
            aleatorio desde el punto de vista estadístico.
          </li>
        </ul>

        <h3 className="subhead orange">Propiedades exigibles</h3>
        <ol>
          <li>Distribución uniforme en <strong>(0,1)</strong>.</li>
          <li>Independencia estadística de los términos.</li>
        </ol>

        <h3 className="subhead ink">Propiedades deseables</h3>
        <ol>
          <li>Generación y acceso <strong>rápidos</strong>.</li>
          <li>Periodo <strong>largo</strong> (gran cantidad de valores antes de repetirse).</li>
          <li>Secuencias <strong>reproducibles</strong>.</li>
          <li>Que no sea <strong>degenerado</strong> (no repetir siempre el mismo número).</li>
        </ol>

        <h3 className="subhead orange">Métodos para generar números aleatorios</h3>
        <ul>
          <li><strong>Manuales:</strong> tablas.</li>
          <li><strong>Mecánicos:</strong> ruleta, lotería o tómbolas.</li>
          <li><strong>Físicos:</strong> fenómenos aleatorios (dispositivos, radiación, etc.).</li>
          <li>
            <strong>Computacionales:</strong> métodos digitales. Aunque no cumplen todas las
            reglas de independencia de una población real, alcanzan propiedades estadísticas
            “fuertes” útiles en muchas aplicaciones. Los más usados: <em>no congruenciales</em>
            y <em> congruenciales</em>.
          </li>
        </ul>
      </section>

      {/* SECCIÓN: MCL (imágenes 5–6) con acento naranja */}
      <section id="mcl" className="page-shell accent-orange">
        <h2 className="title-pill orange">Método Congruencial Lineal (MCL)</h2>
        <p>Propuesto por D. H. Lehmer (1951). Recurre a:</p>
        <p>
          <strong>x<sub>i+1</sub> = (a · x<sub>i</sub> + c) mod m</strong>, &nbsp;
          con <strong>r<sub>i</sub> = x<sub>i</sub> / (m − 1)</strong>.
        </p>
        <p>
          <strong>X₀</strong> es la semilla, <strong>a</strong> la constante multiplicativa,
          <strong> c</strong> la aditiva y <strong>m</strong> el módulo.
        </p>
        <h4>Condiciones para periodo máximo</h4>
        <ul>
          <li><strong>m = 2<sup>g</sup></strong></li>
          <li><strong>a = 1 + 4k</strong> (k entero)</li>
          <li><strong>c</strong> relativamente primo a <strong>m</strong></li>
          <li><strong>g</strong> entero</li>
        </ul>
        <p><strong>Resultado:</strong> periodo máximo <strong>N = m = 2<sup>g</sup></strong>.</p>
        <p><Link to="/lineal" className="inline-link">Ir a la página de Lineal →</Link></p>
      </section>

      {/* SECCIÓN: MCM (imágenes 7–8) con acento turquesa */}
      <section id="mcm" className="page-shell accent-turquoise">
        <h2 className="title-pill turquoise">Método Congruencial Multiplicativo (MCM)</h2>
        <p>Es el MCL cuando <strong>c = 0</strong>. La recurrencia es:</p>
        <p>
          <strong>x<sub>i+1</sub> = (a · x<sub>i</sub>) mod m</strong>, &nbsp;
          con <strong>r<sub>i</sub> = x<sub>i</sub> / (m − 1)</strong>.
        </p>
        <p>
          Parámetros: <strong>X₀</strong>, <strong>a</strong> y <strong>m</strong>, todos enteros y &gt; 0.
        </p>
        <h4>Condiciones usadas</h4>
        <ul>
          <li><strong>m = 2<sup>g</sup></strong></li>
          <li><strong>a = 3 + 8k</strong> o <strong>a = 5 + 8k</strong></li>
          <li><strong>X₀</strong> impar</li>
          <li><strong>k</strong> y <strong>g</strong> enteros</li>
        </ul>
        <p>
          <strong>Periodo máximo:</strong> <strong>N = k / 4 = 2<sup>g−2</sup></strong>.
        </p>
        <p><em>Ejemplo:</em> generar suficientes números con X₀=17, k=2 y g=5 hasta encontrar el periodo.</p>
        <p><Link to="/multiplicativo" className="inline-link">Ir a la página de Multiplicativo →</Link></p>
      </section>
    </>
  );
}
