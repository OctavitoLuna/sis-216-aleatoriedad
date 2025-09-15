import React, { useMemo, useState } from "react";

/**
 * MCM - Método Congruencial Multiplicativo
 * c = 0
 * x_i   = (a * x_{i-1}) mod m
 * r_i   = x_i / (m - 1)   (3 decimales)
 * m     = 2^g
 * a     = 3 + 8k  ó  5 + 8k   (o ingresar A manual)
 * Si g no se provee: g = ceil(log2(D)) + 2  => m = 2^g   (para cubrir D números; periodo ~ 2^{g-2})
 * Fila final: D + 1 para evidenciar repetición
 */

const toInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
};

export default function Multiplicativo() {
  // Entradas (sin valores por defecto)
  const [x0, setX0] = useState("");
  const [k, setK] = useState("");
  const [gInput, setGInput] = useState("");   // g opcional (si vacío, se calcula)
  const [dCount, setDCount] = useState("");   // D = cantidad de números a generar
  const [aOverride, setAOverride] = useState(""); // A manual (opcional)
  const [aFormula, setAFormula] = useState("3");  // "3" => 3+8k  |  "5" => 5+8k

  // Derivados
  const derived = useMemo(() => {
    const hasBase = x0 !== "" && dCount !== "" && (aOverride !== "" || k !== "");
    if (!hasBase) {
      return { ready: false, note: "Completa X0, D y (A o K)", a: "", g: "", m: "", D: "" };
    }

    const K = toInt(k, 0);
    const D = Math.max(1, toInt(dCount, 1));

    // a: override o fórmula
    const A = aOverride !== "" ? toInt(aOverride, 0) : (toInt(aFormula, 3) + 8 * K);

    // g y m
    let g = gInput !== "" ? toInt(gInput, 0) : (Math.ceil(Math.log2(D)) + 2);
    g = Math.max(3, g); // mínimo razonable
    const m = 2 ** g;

    return { ready: true, a: A, g, m, D };
  }, [x0, k, dCount, aOverride, aFormula, gInput]);

  const rows = useMemo(() => {
    if (!derived.ready) return [];
    const X0 = toInt(x0, 0);
    const A = toInt(derived.a, 0);
    const M = toInt(derived.m, 2);
    const D = toInt(derived.D, 1);

    const out = [];
    let prev = X0;
    const total = D + 1; // para mostrar repetición
    for (let i = 1; i <= total; i++) {
      const xi = (A * prev) % M;
      const ri = M > 1 ? xi / (M - 1) : 0;
      out.push({
        i,
        xim1: prev,
        op: `(${A} * ${prev}) MOD(${M})`,
        xi,
        ri,
      });
      prev = xi;
    }
    return out;
  }, [derived, x0]);

  const limpiar = () => {
    setX0(""); setK(""); setGInput(""); setDCount(""); setAOverride(""); setAFormula("3");
  };

  const x0Par = useMemo(() => x0 !== "" && toInt(x0, 0) % 2 === 0, [x0]);

  return (
    <section className="page-shell">

      {/* Banner estilo home */}
      <section className="sub-hero">
        <h1 className="sub-hero-title">Método Congruencial Multiplicativo</h1>
        <p className="sub-hero-sub">
          x<sub>i</sub> = (a · x<sub>i-1</sub>) mod m &nbsp;&nbsp;•&nbsp;&nbsp;
          r<sub>i</sub> = x<sub>i</sub> / (m − 1) &nbsp;&nbsp;&nbsp;&nbsp;
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
              <label>X₀ (impar):</label>
              <input value={x0} onChange={e => setX0(e.target.value)} inputMode="numeric" />
            </div>

            <div className="field">
              <label>K:</label>
              <input value={k} onChange={e => setK(e.target.value)} inputMode="numeric" />
            </div>

            <div className="field">
            <label>Fórmula de a:</label>
            <div className="radio-group">
                <label className="radio-inline">
                <input
                    type="radio"
                    name="aformula"
                    value="3"
                    checked={aFormula === "3"}
                    onChange={(e) => setAFormula(e.target.value)}
                />
                a = 3 + 8k
                </label>
                <label className="radio-inline">
                <input
                    type="radio"
                    name="aformula"
                    value="5"
                    checked={aFormula === "5"}
                    onChange={(e) => setAFormula(e.target.value)}
                />
                a = 5 + 8k
                </label>
            </div>
            </div>


            <div className="field">
              <label>g (para m = 2^g):</label>
              <input value={gInput} onChange={e => setGInput(e.target.value)} inputMode="numeric" />
            </div>

            <div className="field">
              <label>D (cantidad a generar):</label>
              <input value={dCount} onChange={e => setDCount(e.target.value)} inputMode="numeric" />
            </div>

            <div className="field">
              <label>A (opcional):</label>
              <input value={aOverride} onChange={e => setAOverride(e.target.value)} inputMode="numeric" />
            </div>

            <div className="field actions">
              <button className="btn primary" onClick={() => { /* cálculos reactivos */ }}>Generar</button>
              <button className="btn danger" onClick={limpiar}>Limpiar</button>
            </div>
          </div>

          {x0Par && (
            <div className="note warn">
              <span className="badge-warning">Aviso</span> Para periodo máximo, usa <strong>X₀ impar</strong>.
            </div>
          )}
        </div>
      </div>

      {/* Chips de resumen */}
      {derived.ready && (
        <div className="chips">
          <span className="chip">X₀: {toInt(x0, 0)}</span>
          <span className="chip">a: {derived.a}</span>
          <span className="chip">g: {derived.g}</span>
          <span className="chip">m: {derived.m}</span>
          <span className="chip">D: {derived.D}</span>
        </div>
      )}

      {/* Panel de resultados */}
      {derived.ready && (
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
                    const isRepeat = r.i === rows.length; // última: D+1
                    return (
                      <tr
                        key={r.i}
                        className={isRepeat ? "repeat-row" : ""}
                        title={isRepeat ? "Fila extra (D+1): muestra la repetición del primer valor para evidenciar el periodo." : undefined}
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
