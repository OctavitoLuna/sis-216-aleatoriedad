import { Link } from "react-router-dom";

export default function Ejercicios() {
  return (
    <section className="page-shell">
      {/* Sub-hero con el título */}
      <header className="sub-hero">
        <section className="hero">
          <h1 className="hero-title">Ejercicios de simulacion</h1>
          <p className="hero-sub">Conjunto de prácticas orientadas al análisis y modelado de sistemas dinámicos mediante técnicas de simulación computacional. Cada ejercicio busca representar un proceso real, estimar su comportamiento y evaluar alternativas de decisión bajo incertidumbre.</p>
      </section>
      </header>

      {/* Panel de Introducción */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Introducción</h3>
        </div>
        <div className="panel-body">
          <p>
            La simulación es una herramienta fundamental en la ingeniería y la gestión, pues permite reproducir el comportamiento de sistemas reales de manera controlada.<br/>
            En este conjunto de ejercicios se presentan cuatro modelos representativos: un juego de dados, una tienda con demanda variable, una granja productora de huevos y una planta de almacenamiento de azúcar.<br/>
            Cada modelo fue desarrollado bajo un enfoque estocástico, utilizando generadores pseudoaleatorios con semillas variables, tablas de resultados y promedios estadísticos para analizar el desempeño del sistema a lo largo de múltiples simulaciones.<br/>
          </p>
        </div>
      </div>

      {/* Sección de botones / grid de ejercicios */}
      <div className="panel">
        <div className="panel-header alt">
          <h3 className="panel-title">Ejercicios</h3>
        </div>
        <div className="panel-body">
            <div className="exercise-grid">
            {[
                { n: "DepositoFijo", label: "Simulación de depósito a plazo fijo" },
                { n: "DepositoVariable",  label: "Simulación de depósito a plazo variable" },
                { n: "Dados", label: "Simulación de juego de dados" },
                { n: "Tienda", label: "Simulacion de una tienda que sigue una distribucion uniforme" },
                { n: "Gallina", label: "Similacion de cuantos huevos pone una gallina" },
                { n: "Azucar", label: "Simulacion de venta de azucar y calculo de ganancias" },
            ].map((e) => (
                <Link key={e.n} to={`/ejercicios/${e.n}`} className="exercise-card">
                <div className="exercise-badge">#{e.n}</div>
                <div className="exercise-title">{e.label}</div>
                <div className="exercise-cta">Abrir ejercicio</div>
                </Link>
            ))}
            </div>
        </div>
      </div>
    </section>
  );
}
