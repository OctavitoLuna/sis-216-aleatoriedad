import React, { useMemo, useState } from "react";

/* ----------------- Utils ----------------- */
const money = (v) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v);

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296; // [0,1)
  };
}

/* ---------- Parámetros del modelo (constantes) ---------- */
const P_ROTO = 0.20;
const P_ECLOSIONA = 0.30;
const P_SOBREVIVE = 0.80;
const CF = 300; // costo fijo a restar al final

/* Poisson(λ=1) truncado a {0,1,2,3,4} con acumuladas de tu foto */
const POISSON_L1_THRESHOLDS = [
  { t: 0.37, k: 0 },
  { t: 0.74, k: 1 },
  { t: 0.92, k: 2 },
  { t: 0.98, k: 3 },
  { t: 1.00, k: 4 },
];

function huevosPoissonLambda1(u) {
  for (const { t, k } of POISSON_L1_THRESHOLDS) {
    if (u < t) return k;
  }
  return 4;
}

/* ===== Semillas automáticas por fuente (varían siempre) =====
   - rngHuevosDia: cantidad de huevos puestos (Poisson λ=1)
   - rngEvento: decide roto / eclosiona / permanece
   - rngSobrevive: decide si el pollo sobrevive (80%)
   Por simulación s:
     rngX = mulberry32(baseX + s)
   Con baseX dependiente de seedEpoch (para variar en cada recarga / re-simulación)
*/
const SEED_HUEVOS = 13579;
const SEED_EVENTO = 24680;
const SEED_SOBREV = 86420;

export default function Gallina() {
  // Exógenas editables
  const [nmd, setNmd] = useState("30");   // Número máximo de días
  const [pvuh, setPvuh] = useState("1.5"); // Precio venta unitario huevo
  const [pvup, setPvup] = useState("5.0"); // Precio venta unitario pollo
  const [simCount, setSimCount] = useState("3"); // 1..30

  // Epoch de semillas (cambia en recarga y al pulsar re-simulación)
  const [seedEpoch, setSeedEpoch] = useState(
    () => ((Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0)
  );

  // Carrusel
  const [current, setCurrent] = useState(0);

  // Validación
  const ready = useMemo(() => {
    const a = Number(nmd) > 0;
    const b = Number(pvuh) >= 0 && Number(pvup) >= 0;
    const c = Number(simCount) > 0 && Number(simCount) <= 30;
    return a && b && c;
  }, [nmd, pvuh, pvup, simCount]);

  /* ----------------- Simulación ----------------- */
  const sims = useMemo(() => {
    if (!ready) return [];

    const D = Number(nmd);
    const PVUH = Number(pvuh);
    const PVUP = Number(pvup);
    const S = Number(simCount);

    // Bases de semillas que cambian con seedEpoch
    const baseHuevos = (SEED_HUEVOS + (seedEpoch | 0)) | 0;
    const baseEvento = (SEED_EVENTO ^ ((seedEpoch << 1) | 0)) | 0;
    const baseSobrev = (SEED_SOBREV + ((seedEpoch >>> 1) | 0)) | 0;

    const out = [];

    for (let s = 0; s < S; s++) {
      const rngHuevos = mulberry32(baseHuevos + s);
      const rngEvento = mulberry32(baseEvento + s);
      const rngSobrev = mulberry32(baseSobrev + s);

      let totalRotos = 0;
      let totalPerm = 0;     // huevos que permanecen (vendidos como huevo)
      let totalPollos = 0;   // pollos vendidos (sobrevivientes)
      let ingresoAcum = 0;

      const rows = [];

      for (let d_ = 1; d_ <= D; d_++) {
        const puestos = huevosPoissonLambda1(rngHuevos());

        let rotos_d = 0;
        let perm_d = 0;
        let pollos_d = 0;
        let ingreso_d = 0;

        for (let i = 0; i < puestos; i++) {
          const u = rngEvento();
          if (u < P_ROTO) {
            rotos_d += 1;
          } else if (u < P_ROTO + P_ECLOSIONA) {
            if (rngSobrev() < P_SOBREVIVE) {
              pollos_d += 1;
              ingreso_d += PVUP;
            }
          } else {
            perm_d += 1;
            ingreso_d += PVUH;
          }
        }

        totalRotos += rotos_d;
        totalPerm += perm_d;
        totalPollos += pollos_d;
        ingresoAcum += ingreso_d;

        rows.push({
          dia: d_,
          huevosPuestos: puestos,
          huevosRotos: rotos_d,
          huevosVendidos: perm_d,  // permanecen como huevos
          pollosVendidos: pollos_d, // ← nombre corregido
          ingresoDia: ingreso_d,
          ingresoAcum,
        });
      }

      const ingresoTotal = ingresoAcum;
      const ingresoNeto  = ingresoTotal - CF;
      const ingresoPromedioDiario = ingresoTotal / D;

      out.push({
        simIndex: s,
        resumen: {
          NMD: D,
          PVUH, PVUP, CF,
          seedHuevos: baseHuevos + s,
          seedEvento: baseEvento + s,
          seedSobrev: baseSobrev + s,
          totalRotos,
          totalPerm,
          totalPollos,
          ingresoTotal,
          ingresoNeto,
          ingresoPromedioDiario,
        },
        rows,
      });
    }

    return out;
  }, [ready, nmd, pvuh, pvup, simCount, seedEpoch]);

  // Agregados (promedios sobre simulaciones)
  const agregados = useMemo(() => {
    if (sims.length === 0) return null;
    const S = sims.length;
    let sumR = 0, sumP = 0, sumC = 0, sumIT = 0, sumIN = 0, sumIPD = 0;

    for (const s of sims) {
      sumR  += s.resumen.totalRotos;
      sumP  += s.resumen.totalPerm;
      sumC  += s.resumen.totalPollos;
      sumIT += s.resumen.ingresoTotal;
      sumIN += s.resumen.ingresoNeto;
      sumIPD += s.resumen.ingresoPromedioDiario;
    }
    return {
      promRotos: sumR / S,
      promPerm: sumP / S,
      promPollos: sumC / S,
      promIT: sumIT / S,
      promIN: sumIN / S,
      promIPD: sumIPD / S,
      S,
    };
  }, [sims]);

  const currentSim = sims[current] || null;

  const goPrev = () => setCurrent((i) => (i > 0 ? i - 1 : Math.max(0, sims.length - 1)));
  const goNext = () => setCurrent((i) => (i + 1) % Math.max(1, sims.length));
  const goTo   = (i) => setCurrent(i);
  const reSimular = () => {
    setSeedEpoch(((Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0));
    setCurrent(0);
  };

  return (
    <section className="page-shell">
      {/* Título */}
      <header className="hero alt">
        <div className="hero-content">
          <h1 className="hero-title">Simulación — Gallina</h1>
          <p className="hero-sub">
            La gallina pone huevos ~ Poisson(λ=1) por día. 20% se rompen; 30% eclosionan
            (y de esos, 80% sobreviven y se venden como pollos); el resto permanecen y se venden como huevos.
          </p>
        </div>
      </header>

      {/* Consigna */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Instrucciones del problema</h3>
        </div>
        <div className="panel-body">
          <ol>
            <li>Simular <strong>NMD</strong> días. Huevos por día: Poisson(λ=1).</li>
            <li>Por huevo: 20% roto; 30% eclosiona; resto permanece huevo.</li>
            <li>De los eclosionados, 80% sobreviven y se venden como pollos.</li>
            <li>Ingresos: huevo = PVUH; pollo = PVUP. Costo fijo total: {money(CF)}.</li>
            <li>Reportar por día y por simulación; al final mostrar promedios sobre las simulaciones.</li>
          </ol>
        </div>
      </div>

      {/* Diccionario (según tu tabla) */}
      <div className="panel">
        <div className="panel-header alt">
          <h3 className="panel-title">Diccionario de variables</h3>
        </div>
        <div className="panel-body">
          <div className="table-wrap">
            <table className="retro-table">
              <thead>
                <tr>
                  <th>#</th><th>Nombre</th><th>Símbolo</th><th>Clasificación</th><th>Unidades</th><th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>Número Máximo Días</td><td>NMD</td><td>Exógena</td><td>Días</td><td>Horizonte de simulación.</td></tr>
                <tr><td>2</td><td>Contador de Días</td><td>CD</td><td>Endógena</td><td>Días</td><td>Iteración 1..NMD.</td></tr>
                <tr><td>3</td><td>Huevos que pone la gallina</td><td>HPG</td><td>Estado</td><td>Huevos/Día</td><td>Poisson(1), truncado en 0..4.</td></tr>
                <tr><td>4</td><td>Aleatorio HPG</td><td>R(HPG)</td><td>Estado</td><td>0–1/Día</td><td>Uniforme(0,1) para HPG.</td></tr>
                <tr><td>5</td><td>Estado Huevo</td><td>EH</td><td>Estado</td><td>Huevos</td><td>Roto / Eclosiona / Permanece.</td></tr>
                <tr><td>6</td><td>Total Huevos Rotos</td><td>THR</td><td>Endógena</td><td>Huevos</td><td>Acumulado.</td></tr>
                <tr><td>7</td><td>Total Pollos Vendidos</td><td>TPV</td><td>Endógena</td><td>Pollos</td><td>Sobreviven y se venden.</td></tr>
                <tr><td>8</td><td>Total Huevos Vendidos</td><td>THV</td><td>Endógena</td><td>Huevos</td><td>Permanecen como huevo.</td></tr>
                <tr><td>9</td><td>Ingreso Total</td><td>IGT</td><td>Endógena</td><td>Bs</td><td>Σ ingresos.</td></tr>
                <tr><td>10</td><td>Ingreso Promedio Diario</td><td>IPD</td><td>Endógena</td><td>Bs/Día</td><td>IGT/NMD.</td></tr>
                <tr><td>11</td><td>Precio Venta Unitario Huevo</td><td>PVUH</td><td>Exógena</td><td>Bs/Huevo</td><td>Precio por huevo.</td></tr>
                <tr><td>12</td><td>Precio Venta Unitario Pollo</td><td>PVUP</td><td>Exógena</td><td>Bs/Pollo</td><td>Precio por pollo.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Parámetros */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Parámetros de entrada</h3>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label>Número máximo de días (NMD)</label>
              <input type="number" min={1} value={nmd} onChange={(e) => setNmd(e.target.value)} />
            </div>
            <div className="field">
              <label>Precio venta unitario huevo (PVUH)</label>
              <input type="number" min={0} step="0.01" value={pvuh} onChange={(e) => setPvuh(e.target.value)} />
            </div>
            <div className="field">
              <label>Precio venta unitario pollo (PVUP)</label>
              <input type="number" min={0} step="0.01" value={pvup} onChange={(e) => setPvup(e.target.value)} />
            </div>
            <div className="field">
              <label>Cantidad de simulaciones (1–30)</label>
              <input type="number" min={1} max={30} value={simCount} onChange={(e) => setSimCount(e.target.value)} />
            </div>
          </div>

          {!ready && (
            <div className="note warn" style={{ marginTop: 12 }}>
              Completa los campos correctamente para generar la simulación. (Límite: 30 simulaciones)
            </div>
          )}
        </div>
      </div>

      {/* Carrusel */}
      {ready && currentSim && (
        <div className="panel">
          <div className="panel-header alt" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 className="panel-title" style={{ margin: 0 }}>
              Resultados — simulación #{current + 1}
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn" onClick={goPrev} aria-label="Anterior">◀</button>
              <div className="chips">
                {sims.map((_, i) => (
                  <button
                    key={i}
                    className="btn"
                    style={{
                      padding: ".35rem .7rem",
                      borderRadius: 999,
                      background: i === current ? "var(--turquoise)" : "var(--cream)",
                      color: i === current ? "#fff" : "var(--ink)",
                      border: "1px solid rgba(0,0,0,.12)",
                      fontWeight: 800,
                    }}
                    onClick={() => goTo(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button className="btn" onClick={goNext} aria-label="Siguiente">▶</button>
              <button className="btn danger" onClick={reSimular} title="Generar nuevas semillas">
                Re-simulación
              </button>
            </div>
          </div>

          <div className="panel-body">
            {/* Chips resumen y semillas */}
            <div className="chips" style={{ justifyContent: "center" }}>
              <span className="pill">NMD: <strong>{currentSim.resumen.NMD}</strong></span>
              <span className="pill">PVUH: <strong>{money(currentSim.resumen.PVUH)}</strong></span>
              <span className="pill">PVUP: <strong>{money(currentSim.resumen.PVUP)}</strong></span>
              <span className="pill">Seed HPG: <strong>{currentSim.resumen.seedHuevos}</strong></span>
              <span className="pill">Seed EH: <strong>{currentSim.resumen.seedEvento}</strong></span>
              <span className="pill">Seed SV: <strong>{currentSim.resumen.seedSobrev}</strong></span>
            </div>

            {/* Tabla diaria */}
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Huevos puestos</th>
                    <th>Huevos rotos</th>
                    <th>Huevos vendidos</th>
                    <th>Pollos vendidos</th>
                    <th>Ingreso día (Bs)</th>
                    <th>Ganancia acum. (Bs)</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSim.rows.map((r) => (
                    <tr key={r.dia}>
                      <td>{r.dia}</td>
                      <td>{r.huevosPuestos}</td>
                      <td>{r.huevosRotos}</td>
                      <td>{r.huevosVendidos}</td>
                      <td>{r.pollosVendidos}</td>
                      <td>{money(r.ingresoDia)}</td>
                      <td>{money(r.ingresoAcum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen simulación actual */}
            <h4 style={{ marginTop: 16 }}>
            Total huevos rotos: <strong>{currentSim.resumen.totalRotos}</strong>{" "}
            — Total huevos vendidos: <strong>{currentSim.resumen.totalPerm}</strong>{" "}
            — Total pollos vendidos: <strong>{currentSim.resumen.totalPollos}</strong>
            </h4>
            <h4 style={{ marginTop: 6 }}>
            Ingresos (Bs): <strong>{money(currentSim.resumen.ingresoTotal)}</strong>
            </h4>
            <h4 style={{ marginTop: 6 }}>
            Ingreso promedio diario (Bs): <strong>{money(currentSim.resumen.ingresoPromedioDiario)}</strong>
            </h4>
          </div>
        </div>
      )}

      {/* Promedios generales */}
      {ready && agregados && (
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Resultados generales (promedios sobre {agregados.S} simulaciones)</h3>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th>Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total huevos rotos</td>
                    <td>{agregados.promRotos.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Total huevos vendidos</td>
                    <td>{agregados.promPerm.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Total pollos vendidos</td>
                    <td>{agregados.promPollos.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Ingresos (Bs)</td>
                    <td>{money(agregados.promIT)}</td>
                  </tr>
                  <tr>
                    <td>Ingreso promedio diario (Bs)</td>
                    <td>{money(agregados.promIPD)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
