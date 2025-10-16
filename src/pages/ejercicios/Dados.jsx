import React, { useMemo, useState } from "react";

/* ----------------- Utils ----------------- */
// Formato moneda BOB
const money = (v) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(v);

// PRNG con semilla (mulberry32) – determinístico y rápido
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296; // [0,1)
  };
}

// mapea un U~[0,1) a cara de dado 1..6 estilo del código Python: round(1 + 5u)
function dadoPorU(u) {
  const v = Math.round(1 + 5 * u);
  // clamp por seguridad
  return Math.max(1, Math.min(6, v));
}

/* ====== Semillas automáticas ======
   Cada simulación s usa semillas distintas por dado:
   seedD1 = SEED_D1_BASE (+ variación) + s
   seedD2 = SEED_D2_BASE (+ variación) + s
*/
const SEED_D1_BASE = 1234;
const SEED_D2_BASE = 9876;

/* =============== Página =============== */
export default function Dados() {
  // Parámetros de entrada
  const [nmj, setNmj] = useState("100");        // Número máximo de juegos
  const [puj, setPuj] = useState("2");          // Precio unitario del juego (ingreso si NO sale 7)
  const [cus7, setCus7] = useState("5");        // Costo cuando la suma es 7
  const [simCount, setSimCount] = useState("3");// Cantidad de simulaciones

  // Epoch de semillas: cambia en cada recarga y al presionar "Re-simulación"
  const [seedEpoch, setSeedEpoch] = useState(() => ((Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0));

  // Navegación del carrusel
  const [current, setCurrent] = useState(0); // índice 0..simCount-1

  // Validación mínima
  const ready = useMemo(() => {
    const a = Number(nmj) > 0;
    const b = Number(puj) >= 0;
    const c = Number(cus7) >= 0;
    const d = Number(simCount) > 0 && Number(simCount) <= 30; // ← límite ahora 30
    return a && b && c && d;
  }, [nmj, puj, cus7, simCount]);

  /* -------- Simulación: genera TODAS las simulaciones --------
     Cada simulación s usa:
       rng1 = mulberry32(base1 + s)
       rng2 = mulberry32(base2 + s)
     donde base1/base2 varían con seedEpoch (para que siempre cambien).
  */
  const sims = useMemo(() => {
    if (!ready) return [];

    const N = Number(nmj);
    const precio = Number(puj);
    const costo7 = Number(cus7);
    const S = Number(simCount);

    // Variación de semillas a partir de seedEpoch
    const base1 = (SEED_D1_BASE + (seedEpoch | 0)) | 0;
    const base2 = (SEED_D2_BASE ^ ((seedEpoch << 1) | 0)) | 0;

    const out = [];

    for (let s = 0; s < S; s++) {
      const rng1 = mulberry32(base1 + s);
      const rng2 = mulberry32(base2 + s);

      let gananciaCasa = 0.0;
      let ganadosCasa = 0;
      const rows = [];

      for (let cj = 1; cj <= N; cj++) {
        const r1 = rng1();
        const r2 = rng2();
        const d1 = dadoPorU(r1);
        const d2 = dadoPorU(r2);
        const suma = d1 + d2;

        if (suma === 7) {
          gananciaCasa += precio - costo7; // la casa paga costo7 al jugador
        } else {
          gananciaCasa += precio;          // la casa cobra el precio del juego
          ganadosCasa += 1;
        }

        rows.push({
          cj,
          gncAcum: gananciaCasa,
          r1,
          r2,
          d1,
          d2,
          suma,
          njgc: ganadosCasa,
        });
      }

      const pjc = (ganadosCasa / N) * 100;

      out.push({
        simIndex: s,            // 0-based
        resumen: {
          GNC: gananciaCasa,
          NJGC: ganadosCasa,
          PJC: pjc,
          NMJ: N,
          PUJ: precio,
          CUS7: costo7,
          seedD1: base1 + s,
          seedD2: base2 + s,
        },
        rows,
      });
    }

    return out;
  }, [ready, nmj, puj, cus7, simCount, seedEpoch]); // ← depende de seedEpoch

  // Agregados (promedios) sobre todas las simulaciones
  const agregados = useMemo(() => {
    if (sims.length === 0) return null;
    const S = sims.length;
    let sumGNC = 0, sumNJGC = 0, sumPJC = 0;

    for (const s of sims) {
      sumGNC += s.resumen.GNC;
      sumNJGC += s.resumen.NJGC;
      sumPJC += s.resumen.PJC;
    }
    return {
      promGNC: sumGNC / S,
      promNJGC: sumNJGC / S,
      promPJC: sumPJC / S,
      NMJ: sims[0].resumen.NMJ,
      S,
    };
  }, [sims]);

  const goPrev = () => setCurrent((i) => (i > 0 ? i - 1 : Math.max(0, sims.length - 1)));
  const goNext = () => setCurrent((i) => (i + 1) % Math.max(1, sims.length));
  const goTo = (i) => setCurrent(i);

  const currentSim = sims[current];

  // NUEVO: acción de re-simulación (cambia semillas y reinicia al #1)
  const reSimular = () => {
    setSeedEpoch(((Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0));
    setCurrent(0);
  };

  return (
    <section className="page-shell">
      {/* Título */}
      <header className="hero alt">
        <div className="hero-content">
          <h1 className="hero-title">Juego de dados</h1>
          <p className="hero-sub">
            El apostador lanza 2 dados; si la suma es 7, la casa paga un costo (CUS7).
            En otro caso, la casa cobra el precio del juego (PUJ). Se simulan N juegos.
            Cada simulación usa <strong>semillas distintas por dado</strong>.
          </p>
        </div>
      </header>

      {/* Consigna – resumida */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Instrucciones del problema</h3>
        </div>
        <div className="panel-body">
          <ol>
            <li>Definir <strong>NMJ</strong>, <strong>PUJ</strong>, <strong>CUS7</strong> y cantidad de simulaciones.</li>
            <li>Para cada simulación, se usan semillas <em>(automáticas)</em> distintas por dado.</li>
            <li>Registrar por ronda: CJ, r₁, r₂, d₁, d₂, d₁+d₂, GNC acumulada y NJGC.</li>
            <li>Al final: <strong>GNC</strong>, <strong>NJGC</strong> y <strong>PJC</strong>. Abajo se muestra el promedio de todas las simulaciones.</li>
          </ol>
        </div>
      </div>

      {/* Diccionario de variables (de tu foto) */}
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
                <tr><td>1</td><td>Número máximo de juegos</td><td>NMJ</td><td>Exógena</td><td>Juegos</td><td>Total de tiradas por simulación.</td></tr>
                <tr><td>2</td><td>Contador del juego</td><td>CJ</td><td>Endógena</td><td>Juegos</td><td>Iteración 1..NMJ.</td></tr>
                <tr><td>3</td><td>Resultado dado 1</td><td>D₁</td><td>Estado</td><td>1–6/juego</td><td>Cara observada para el dado 1.</td></tr>
                <tr><td>4</td><td>Resultado dado 2</td><td>D₂</td><td>Estado</td><td>1–6/juego</td><td>Cara observada para el dado 2.</td></tr>
                <tr><td>5</td><td>Aleatorio dado 1</td><td>R₁</td><td>Estado</td><td>0–1/juego</td><td>Uniforme(0,1) generado con semilla del dado 1.</td></tr>
                <tr><td>6</td><td>Aleatorio dado 2</td><td>R₂</td><td>Estado</td><td>0–1/juego</td><td>Uniforme(0,1) generado con semilla del dado 2.</td></tr>
                <tr><td>7</td><td>Suma de dados</td><td>S</td><td>Estado</td><td>2–12/juego</td><td>S = D₁ + D₂.</td></tr>
                <tr><td>8</td><td>Precio unitario del juego</td><td>PUJ</td><td>Exógena</td><td>Bs/juego</td><td>Ingreso cuando <em>S≠7</em>.</td></tr>
                <tr><td>9</td><td>Costo unitario si Suma es 7</td><td>CUS7</td><td>Exógena</td><td>Bs/juego</td><td>Pago de la casa cuando <em>S=7</em>.</td></tr>
                <tr><td>10</td><td>Número de juegos ganados por la casa</td><td>NJGC</td><td>Endógena</td><td>Juegos</td><td>Se incrementa cuando <em>S≠7</em>.</td></tr>
                <tr><td>11</td><td>Porcentaje de juegos ganados por la casa</td><td>PJC</td><td>Endógena</td><td>%</td><td>100·NJGC/NMJ.</td></tr>
                <tr><td>12</td><td>Ganancia neta de la casa</td><td>GNC</td><td>Endógena</td><td>Bs</td><td>Σ (PUJ si S≠7; PUJ−CUS7 si S=7).</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Parámetros de entrada */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Parámetros de entrada</h3>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label>Número máximo de juegos (NMJ)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={nmj}
                onChange={(e) => {
                  const v = e.target.value;
                  // Solo enteros no negativos (permitir vacío)
                  if (v === "" || /^\d+$/.test(v)) setNmj(v);
                }}
              />
            </div>
            <div className="field">
              <label>Precio unitario del juego (PUJ)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={puj}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || Number(v) >= 0) setPuj(v);
                }}
              />
            </div>
            <div className="field">
              <label>Costo si suma 7 (CUS7)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cus7}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || Number(v) >= 0) setCus7(v);
                }}
              />
            </div>
            <div className="field">
              <label>Cantidad de simulaciones</label>
              <input
                type="number"
                min={1}
                max={30}
                step={1}
                value={simCount}
                onChange={(e) => {
                  const v = e.target.value;
                  // Solo enteros no negativos (permitir vacío)
                  if (v === "" || /^\d+$/.test(v)) setSimCount(v);
                }}
              />
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
      {ready && sims.length > 0 && (
        <div className="panel">
          <div className="panel-header alt" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 className="panel-title" style={{ margin: 0 }}>
              Resultados — simulación #{current + 1}
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn" onClick={goPrev} aria-label="Anterior">◀</button>
              {/* Píldoras numeradas */}
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

              {/* NUEVO: botón Re-simulación */}
              <button className="btn danger" onClick={reSimular} title="Generar nuevas semillas">
                Re-simulación
              </button>
            </div>
          </div>

          {/* Cuerpo del “card” actual */}
          <div className="panel-body">
            {/* Chips resumen de parámetros y semillas usadas */}
            <div className="chips" style={{ justifyContent: "center" }}>
              <span className="pill">NMJ: <strong>{currentSim.resumen.NMJ}</strong></span>
              <span className="pill">PUJ: <strong>{money(currentSim.resumen.PUJ)}</strong></span>
              <span className="pill">CUS7: <strong>{money(currentSim.resumen.CUS7)}</strong></span>
              <span className="pill">Seed D1: <strong>{currentSim.resumen.seedD1}</strong></span>
              <span className="pill">Seed D2: <strong>{currentSim.resumen.seedD2}</strong></span>
            </div>

            {/* Tabla de rondas */}
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>CJ</th>
                    <th>GNC acumulada</th>
                    <th>r₁</th>
                    <th>r₂</th>
                    <th>d₁</th>
                    <th>d₂</th>
                    <th>d₁+d₂</th>
                    <th>NJGC</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSim.rows.map((r) => (
                    <tr key={r.cj} className={r.suma === 7 ? "repeat-row" : ""}>
                      <td>{r.cj}</td>
                      <td>{money(r.gncAcum)}</td>
                      <td>{r.r1.toFixed(4)}</td>
                      <td>{r.r2.toFixed(4)}</td>
                      <td>{r.d1}</td>
                      <td>{r.d2}</td>
                      <td>{r.suma}</td>
                      <td>{r.njgc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen de la simulación actual */}
            <h4 style={{ marginTop: 16 }}>
              GNC: <span className="tag success">{money(currentSim.resumen.GNC)}</span>{" "}
              — NJGC: <strong>{currentSim.resumen.NJGC}/{currentSim.resumen.NMJ}</strong>{" "}
              — PJC: <strong>{currentSim.resumen.PJC.toFixed(2)}%</strong>
            </h4>
          </div>
        </div>
      )}

      {/* Tabla de resultados generales (promedios de todas las simulaciones) */}
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
                    <td>Ganancia neta de la casa (GNC)</td>
                    <td>{money(agregados.promGNC)}</td>
                  </tr>
                  <tr>
                    <td>Juegos ganados por la casa (NJGC)</td>
                    <td>{agregados.promNJGC.toFixed(2)} / {agregados.NMJ}</td>
                  </tr>
                  <tr>
                    <td>Porcentaje de victorias de la casa (PJC)</td>
                    <td>{agregados.promPJC.toFixed(2)}%</td>
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
