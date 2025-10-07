import React, { useMemo, useState } from "react";

const money = (v) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v);

export default function DepositoFijo() {
  const [capital0, setCapital0] = useState("");
  const [tasaAnualPct, setTasaAnualPct] = useState("");
  const [anios, setAnios] = useState("");

  const ready = useMemo(() => {
    return (
      capital0 !== "" &&
      tasaAnualPct !== "" &&
      anios !== "" &&
      Number(capital0) > 0 &&
      Number(anios) > 0
    );
  }, [capital0, tasaAnualPct, anios]);

  const { rows, kFinal } = useMemo(() => {
    if (!ready) return { rows: [], kFinal: null };
    const i = Number(tasaAnualPct) / 100;
    let K = Number(capital0);
    const n = Number(anios);
    const out = [];
    for (let t = 1; t <= n; t++) {
      const interes = K * i;
      const kNext = K + interes;
      out.push({ anio: t, kap_t: K, interes, kap_t1: kNext });
      K = kNext;
    }
    return { rows: out, kFinal: K };
  }, [ready, capital0, tasaAnualPct, anios]);

  return (
    <section className="page-shell">
      {/* Título */}
        <header className="hero alt">
        <div className="hero-content">
            <h1 className="hero-title">Simulación de depósito a plazo fijo</h1>
            <p className="hero-sub">
            Calcula la evolución de un capital sujeto a una tasa de interés fija
            durante un período determinado.
            </p>
        </div>
        </header>

        

      {/* Instrucciones */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Instrucciones del problema</h3>
        </div>
        <div className="panel-body">
          <p>
            Construir un modelo de simulación de depósito a plazo fijo. Determinar
            el capital final considerando una tasa de interés constante y un número
            de años definidos.
          </p>
          <p>
            El interés se calcula anualmente de forma compuesta:{" "}
            <code>K(t+1) = K(t) + K(t) × i</code>.
          </p>
        </div>
      </div>

      {/* Diccionario de variables */}
      <div className="panel">
        <div className="panel-header alt">
          <h3 className="panel-title">Diccionario de variables</h3>
        </div>
        <div className="panel-body">
          <div className="table-wrap">
            <table className="retro-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre de la variable</th>
                  <th>Símbolo</th>
                  <th>Clasificación</th>
                  <th>Unidades</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Tiempo de depósito a plazo fijo</td>
                  <td>T</td>
                  <td>Exógena</td>
                  <td>Años</td>
                  <td>Duración total del depósito o inversión.</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Contador</td>
                  <td>C</td>
                  <td>Endógena</td>
                  <td>Años</td>
                  <td>Incrementa cada período simulado (año).</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Tasa de interés</td>
                  <td>i</td>
                  <td>Exógena</td>
                  <td>%</td>
                  <td>Porcentaje de interés aplicado anualmente.</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Capital</td>
                  <td>K</td>
                  <td>Endógena</td>
                  <td>Bs</td>
                  <td>Monto acumulado de dinero en el depósito.</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Interés</td>
                  <td>I</td>
                  <td>Estado</td>
                  <td>Bs/año</td>
                  <td>Interés generado durante cada año del plazo.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Parámetros de entrada</h3>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label>Capital inicial (Bs)</label>
              <input
                type="number"
                value={capital0}
                onChange={(e) => setCapital0(e.target.value)}
                placeholder="Ej: 10000"
              />
            </div>
            <div className="field">
              <label>Tasa de interés anual (%)</label>
              <input
                type="number"
                value={tasaAnualPct}
                onChange={(e) => setTasaAnualPct(e.target.value)}
                placeholder="Ej: 4.5"
              />
            </div>
            <div className="field">
              <label>Tiempo (años)</label>
              <input
                type="number"
                value={anios}
                onChange={(e) => setAnios(e.target.value)}
                placeholder="Ej: 10"
              />
            </div>
          </div>

          {!ready && (
            <div className="note warn" style={{ marginTop: 12 }}>
              Completa todos los campos para generar la simulación.
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      {ready && (
        <div className="panel">
          <div className="panel-header alt">
            <h3 className="panel-title">Resultados</h3>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>Año (C)</th>
                    <th>Capital inicial Kₜ</th>
                    <th>Interés Iₜ</th>
                    <th>Capital final Kₜ₊₁</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.anio}>
                      <td>{r.anio}</td>
                      <td>{money(r.kap_t)}</td>
                      <td>{money(r.interes)}</td>
                      <td>{money(r.kap_t1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{ marginTop: 16 }}>
              Capital final después de {anios} años:{" "}
              <span className="tag success">{money(kFinal)}</span>
            </h4>
          </div>
        </div>
      )}
    </section>
  );
}
