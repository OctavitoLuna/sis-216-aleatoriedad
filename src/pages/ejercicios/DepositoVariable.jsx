import React, { useMemo, useState } from "react";

const money = (v) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v);

export default function DepositoVariable() {
  const [capital0, setCapital0] = useState("");
  const [anios, setAnios] = useState("");

  const ready = useMemo(() => {
    return capital0 !== "" && anios !== "" && Number(capital0) > 0 && Number(anios) > 0;
  }, [capital0, anios]);

  // Determinación automática de la tasa según el capital
  const tasa = useMemo(() => {
    const K = Number(capital0);
    if (K > 0 && K <= 10000) return 0.035;
    if (K > 10000 && K <= 100000) return 0.037;
    if (K > 100000) return 0.04;
    return null;
  }, [capital0]);

  // Simulación
  const { rows, kFinal } = useMemo(() => {
    if (!ready || !tasa) return { rows: [], kFinal: null };
    let K = Number(capital0);
    const n = Number(anios);
    const out = [];
    for (let t = 1; t <= n; t++) {
      const interes = K * tasa;
      const kNext = K + interes;
      out.push({ anio: t, kap_t: K, interes, kap_t1: kNext });
      K = kNext;
    }
    return { rows: out, kFinal: K };
  }, [ready, capital0, tasa, anios]);

  return (
    <section className="page-shell">
      {/* Título */}
      <header className="hero alt">
        <div className="hero-content">
          <h1 className="hero-title">Simulación de depósito a plazo variable</h1>
          <p className="hero-sub">
            Calcula la evolución de un capital donde la tasa de interés varía
            automáticamente según el monto depositado.
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
            Construir un modelo de simulación de depósito a plazo variable. La
            tasa de interés aplicada depende del monto inicial depositado.
          </p>
          <p>
            La relación es la siguiente:
            <ul>
              <li>Si el capital ≤ 10.000 Bs → 3.5%</li>
              <li>Si el capital ≤ 100.000 Bs → 3.7%</li>
              <li>Si el capital &gt; 100.000 Bs → 4.0%</li>
            </ul>
          </p>
          <p>
            El interés se calcula anualmente:{" "}
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
                  <td>Tiempo de depósito a plazo variable</td>
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
                  <td>Endógena</td>
                  <td>%</td>
                  <td>
                    Porcentaje anual calculado automáticamente según el capital inicial.
                  </td>
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
                placeholder="Ej: 15000"
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
              Completa los campos para generar la simulación.
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
            <div className="chips" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="pill">
                Capital inicial: <strong>{money(Number(capital0))}</strong>
              </span>
              <span className="pill">
                Tasa aplicada: <strong>{(tasa * 100).toFixed(1)}%</strong>
              </span>
              <span className="pill">
                Años: <strong>{anios}</strong>
              </span>
            </div>

            <div className="table-wrap" style={{ marginTop: 16 }}>
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
