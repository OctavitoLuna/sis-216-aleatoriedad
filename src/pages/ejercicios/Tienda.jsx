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

/* ====== Semillas automáticas por fuente ======
   - Llegadas por hora (clientes/hora): SEED_ARR
   - Artículos por cliente (discreta 0,1,2,3): SEED_ART
   Por simulación s:
     rngArr = mulberry32(baseArr + s)
     rngArt = mulberry32(baseArt + s)
   Y baseArr/baseArt cambian con seedEpoch para que SIEMPRE varíe.
*/
const SEED_ARR = 20251;
const SEED_ART = 7919;

export default function Tienda() {
  /* --------- Parámetros (puedes cambiarlos) ---------- */
  const [nmh, setNmh] = useState("10");   // Número máximo de horas
  const [cua, setCua] = useState("50");   // Costo unitario de adquisición (Bs/art)
  const [pvu, setPvu] = useState("75");   // Precio de venta unitario (Bs/art)
  const [cf,  setCf]  = useState("300");  // Costo fijo diario (Bs)
  const [simCount, setSimCount] = useState("3"); // cantidad de simulaciones (1..30)

  // Epoch de semillas: cambia en cada recarga y al pulsar Re-simulación
  const [seedEpoch, setSeedEpoch] = useState(
    () => ((Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0)
  );

  const [current, setCurrent] = useState(0);

  const ready = useMemo(() => {
    const a = Number(nmh) > 0;
    const b = Number(cua) >= 0 && Number(pvu) >= 0 && Number(cf) >= 0;
    const c = Number(simCount) > 0 && Number(simCount) <= 30;
    return a && b && c;
  }, [nmh, cua, pvu, cf, simCount]);

  /* -------- Distribución artículos por cliente --------
     Probabilidades (de tu enunciado/Python):
       0 art → 0.2
       1 art → 0.3  (acum. 0.5)
       2 art → 0.4  (acum. 0.9)
       3 art → 0.1  (resto)
  */
  function articulosPorCliente(u) {
    if (u <= 0.2) return 0;
    if (u <= 0.5) return 1;
    if (u <= 0.9) return 2;
    return 3;
  }

  /* ----------------- Simulación ----------------- */
  const sims = useMemo(() => {
    if (!ready) return [];

    const H  = Number(nmh);
    const CUA = Number(cua);
    const PVU = Number(pvu);
    const CF  = Number(cf);
    const S = Number(simCount);

    // variar semillas con epoch (para que siempre cambien)
    const baseArr = (SEED_ARR + (seedEpoch | 0)) | 0;
    const baseArt = (SEED_ART ^ ((seedEpoch << 1) | 0)) | 0;

    const out = [];

    for (let s = 0; s < S; s++) {
      const rngArr = mulberry32(baseArr + s);
      const rngArt = mulberry32(baseArt + s);

      let totalArtVendidos = 0;
      let totalIngresos = 0;
      let totalCostoProductos = 0;
      let totalGanancia = 0;

      const rows = [];

      for (let h = 1; h <= H; h++) {
        // clientes por hora: uniforme entero 0..4 (como en tu Python)
        const clientes = Math.floor(rngArr() * 5); // 0,1,2,3,4
        let vendidosHora = 0;

        for (let c = 0; c < clientes; c++) {
          const u = rngArt();
          vendidosHora += articulosPorCliente(u);
        }

        const ingresos = vendidosHora * PVU;
        const costoProd = vendidosHora * CUA;
        const ganancia = ingresos - costoProd;

        totalArtVendidos += vendidosHora;
        totalIngresos += ingresos;
        totalCostoProductos += costoProd;
        totalGanancia += ganancia;

        rows.push({
          hora: h,
          clientes,
          vendidos: vendidosHora,
          ingresos,
          costoProd,
          ganancia,
        });
      }

      const gananciaTotal = totalGanancia;
      const gananciaNeta  = gananciaTotal - CF;

      out.push({
        simIndex: s,
        resumen: {
          NMH: H,
          CUA, PVU, CF,
          seedArr: baseArr + s,
          seedArt: baseArt + s,
          totalVendidos: totalArtVendidos,
          gananciaTotal,
          gananciaNeta,
        },
        rows,
      });
    }

    return out;
  }, [ready, nmh, cua, pvu, cf, simCount, seedEpoch]);

  // Promedios sobre todas las simulaciones
  const agregados = useMemo(() => {
    if (sims.length === 0) return null;
    const S = sims.length;
    let sumVend = 0, sumGT = 0, sumGN = 0;

    for (const s of sims) {
      sumVend += s.resumen.totalVendidos;
      sumGT   += s.resumen.gananciaTotal;
      sumGN   += s.resumen.gananciaNeta;
    }
    return {
      promVendidos: sumVend / S,
      promGT: sumGT / S,
      promGN: sumGN / S,
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
          <h1 className="hero-title">Simulación de Tienda</h1>
          <p className="hero-sub">
            Llegadas de clientes por hora (uniforme 0..4). Cada cliente compra
            0,1,2 o 3 artículos según probabilidades (0.2, 0.3, 0.4, 0.1).
            Se simulan <strong>NMH</strong> horas y se calculan totales y ganancias.
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
            <li>Definir <strong>NMH</strong>, <strong>CUA</strong>, <strong>PVU</strong>, <strong>CF</strong> y cantidad de simulaciones.</li>
            <li>Para cada hora, generar clientes ~ uniforme entero 0..4.</li>
            <li>Para cada cliente, generar artículos 0/1/2/3 con probabilidades 0.2/0.3/0.4/0.1.</li>
            <li>Por hora calcular: artículos vendidos, ingresos, costo de productos y ganancia.</li>
            <li>Al final por simulación: total de artículos vendidos, ganancia total y ganancia neta (después de CF).</li>
          </ol>
        </div>
      </div>

      {/* Diccionario (según tus aclaraciones) */}
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
                <tr><td>1</td><td>Número máximo de horas</td><td>NMH</td><td>Exógena</td><td>horas</td><td>Duración de la simulación.</td></tr>
                <tr><td>2</td><td>Contador de hora</td><td>CH</td><td>Endógena</td><td>horas</td><td>Iteración 1..NMH.</td></tr>
                <tr><td>3</td><td>Llegadas de clientes</td><td>LLCLI</td><td>Estado</td><td>clientes/hora</td><td>Número de clientes en la hora.</td></tr>
                <tr><td>4</td><td>Aleatorio (llegada cliente)</td><td>R(LLCLI)</td><td>Estado</td><td>0–1/hora</td><td>Uniforme(0,1) para llegar clientes.</td></tr>
                <tr><td>5</td><td>Artículos comprados/cliente</td><td>ARTCC</td><td>Estado</td><td>art/cliente</td><td>0,1,2,3 con p=0.2,0.3,0.4,0.1.</td></tr>
                <tr><td>6</td><td>Aleatorio ARTCC</td><td>R(ARTCC)</td><td>Estado</td><td>0–1/cliente</td><td>Uniforme(0,1) para ARTCC.</td></tr>
                <tr><td>7</td><td>Total artículos por hora</td><td>T(ARTCC)</td><td>Endógena</td><td>art</td><td>Suma de ARTCC en la hora.</td></tr>
                <tr><td>8</td><td>Ganancia total</td><td>GT</td><td>Endógena</td><td>Bs</td><td>Σ (ingresos − costo productos).</td></tr>
                <tr><td>9</td><td>Costo fijo diario</td><td>CF</td><td>Exógena</td><td>Bs</td><td>Costo fijo del día.</td></tr>
                <tr><td>10</td><td>Costo unitario adquisición</td><td>CUA</td><td>Exógena</td><td>Bs</td><td>Costo por artículo.</td></tr>
                <tr><td>11</td><td>Precio de venta unitario</td><td>PVU</td><td>Exógena</td><td>Bs</td><td>Ingreso por artículo.</td></tr>
                <tr><td>12</td><td>Ganancia neta</td><td>GNETA</td><td>Endógena</td><td>Bs</td><td>GT − CF.</td></tr>
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
              <label>Número máximo de horas (NMH)</label>
              <input type="number" min={1} value={nmh} onChange={(e) => setNmh(e.target.value)} />
            </div>
            <div className="field">
              <label>Costo unitario de adquisición (CUA)</label>
              <input type="number" min={0} step="0.01" value={cua} onChange={(e) => setCua(e.target.value)} />
            </div>
            <div className="field">
              <label>Precio de venta unitario (PVU)</label>
              <input type="number" min={0} step="0.01" value={pvu} onChange={(e) => setPvu(e.target.value)} />
            </div>
            <div className="field">
              <label>Costo fijo diario (CF)</label>
              <input type="number" min={0} step="0.01" value={cf} onChange={(e) => setCf(e.target.value)} />
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

      {/* Carrusel de simulaciones */}
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

          {/* Card de la simulación actual */}
          <div className="panel-body">
            <div className="chips" style={{ justifyContent: "center" }}>
              <span className="pill">NMH: <strong>{currentSim.resumen.NMH}</strong></span>
              <span className="pill">CUA: <strong>{money(currentSim.resumen.CUA)}</strong></span>
              <span className="pill">PVU: <strong>{money(currentSim.resumen.PVU)}</strong></span>
              <span className="pill">CF: <strong>{money(currentSim.resumen.CF)}</strong></span>
              <span className="pill">Seed Arr: <strong>{currentSim.resumen.seedArr}</strong></span>
              <span className="pill">Seed Art: <strong>{currentSim.resumen.seedArt}</strong></span>
            </div>

            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Clientes (LLCLI)</th>
                    <th>Artículos vendidos</th>
                    <th>Ingresos</th>
                    <th>Costo productos</th>
                    <th>Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSim.rows.map((r) => (
                    <tr key={r.hora}>
                      <td>{r.hora}</td>
                      <td>{r.clientes}</td>
                      <td>{r.vendidos}</td>
                      <td>{money(r.ingresos)}</td>
                      <td>{money(r.costoProd)}</td>
                      <td>{money(r.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{ marginTop: 16 }}>
              Total artículos vendidos: <strong>{currentSim.resumen.totalVendidos}</strong>{" "}
              — Ganancia total: <strong>{money(currentSim.resumen.gananciaTotal)}</strong>{" "}
              — Ganancia neta: <span className="tag success">{money(currentSim.resumen.gananciaNeta)}</span>
            </h4>
          </div>
        </div>
      )}

      {/* Promedios generales (sobre todas las simulaciones) */}
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
                    <td>Total de artículos vendidos</td>
                    <td>{agregados.promVendidos.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Ganancia total (Σ ingresos − costos)</td>
                    <td>{money(agregados.promGT)}</td>
                  </tr>
                  <tr>
                    <td>Ganancia neta (después de CF)</td>
                    <td>{money(agregados.promGN)}</td>
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
