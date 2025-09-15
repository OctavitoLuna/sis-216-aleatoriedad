import React, { useMemo, useState } from "react";

/**
 * MCL - Método Congruencial Lineal
 * Entradas: X0, K, c, P(m), A o D (a)
 * Xi   = (a*Xi-1 + c) mod m
 * ri   = Xi/(m-1)   (3 decimales)
 * Filas: P+1 para mostrar la repetición del primero
 */

const toInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
};

export default function Lineal() {
  // 👉 Sin valores por defecto
  const [x0, setX0] = useState("");
  const [k, setK] = useState("");
  const [c, setC] = useState("");
  const [p, setP] = useState("");            // P ≡ m
  const [aInput, setAInput] = useState("");  // "A o D" (a)

  const { a, m, g, ready } = useMemo(() => {
    const hasAll = [x0, c, p].every(v => v !== "") && (aInput !== "" || k !== "");
    if (!hasAll) return { a: "", m: "", g: "", ready: false };

    const K = toInt(k, 0);
    const P = Math.max(2, toInt(p, 2));
    const A = aInput !== "" ? toInt(aInput, 0) : 1 + 4 * K;
    const G = Math.log2(P);

    return { a: A, m: P, g: Number.isFinite(G) ? Math.round(G) : 0, ready: true };
  }, [x0, k, c, p, aInput]);

  const rows = useMemo(() => {
    if (!ready) return [];
    const X0 = toInt(x0, 0);
    const C = toInt(c, 0);
    const M = Math.max(2, toInt(m, 2));
    const A = toInt(a, 0);

    const out = [];
    let prev = X0;
    const total = M + 1; // P + 1
    for (let i = 1; i <= total; i++) {
      const xi = (A * prev + C) % M;
      const ri = M > 1 ? xi / (M - 1) : 0;
      out.push({ i, xim1: prev, op: `(${A} * ${prev} + ${C}) MOD(${M})`, xi, ri });
      prev = xi;
    }
    return out;
  }, [ready, x0, c, m, a]);

  const limpiar = () => {
    setX0(""); setK(""); setC(""); setP(""); setAInput("");
  };

  return (
    <section className="page-shell">

      {/* Banner estilo home */}
      <section className="sub-hero">
        <h1 className="sub-hero-title">Método Congruencial Lineal</h1>
        <p className="sub-hero-sub">
          x<sub>i</sub> = (a · x<sub>i-1</sub> + c) mod m &nbsp;&nbsp;•&nbsp;&nbsp;
          r<sub>i</sub> = x<sub>i</sub> / (m − 1)
        </p>
      </section>

      {/* Panel de parámetros */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Parámetros</h3>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label>X₀:</label>
              <input value={x0} onChange={e => setX0(e.target.value)} inputMode="numeric" />
            </div>
            <div className="field">
              <label>K:</label>
              <input value={k} onChange={e => setK(e.target.value)} inputMode="numeric" />
            </div>
            <div className="field">
              <label>c:</label>
              <input value={c} onChange={e => setC(e.target.value)} inputMode="numeric" />
            </div>
            <div className="field">
              <label>P (m):</label>
              <input value={p} onChange={e => setP(e.target.value)} inputMode="numeric" />
            </div>
            <div className="field">
            <label>A o D (opcional):</label>
            <input
                value={aInput}
                onChange={e => setAInput(e.target.value)}
                inputMode="numeric"
                placeholder="a = 1 + 4k"
            />
            </div>

            <div className="field actions">
              <button className="btn primary" onClick={() => { /* reactivo */ }}>Generar</button>
              <button className="btn danger" onClick={limpiar}>Limpiar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Chips de resumen */}
      {ready && (
        <div className="chips">
          <span className="chip">X₀: {toInt(x0, 0)}</span>
          <span className="chip">a: {a}</span>
          <span className="chip">c: {toInt(c, 0)}</span>
          <span className="chip">g: {g}</span>
          <span className="chip">m: {m}</span>
        </div>
      )}

      {/* Panel de resultados */}
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
                    <th>i</th>
                    <th>X<sub>i-1</sub></th>
                    <th>Operación</th>
                    <th>X<sub>i</sub></th>
                    <th>r<sub>i</sub></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isRepeat = r.i === rows.length; // última (P+1)
                    return (
                      <tr
                        key={r.i}
                        className={isRepeat ? "repeat-row" : ""}
                        title={isRepeat ? "Fila extra (P+1): muestra la repetición del primer valor para evidenciar el periodo." : undefined}
                      >
                        <td>{r.i}</td>
                        <td>{r.xim1}</td>
                        <td className="op">{r.op}</td>
                        <td>{r.xi}</td>
                        <td>{(Math.round(r.ri * 1000) / 1000).toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
