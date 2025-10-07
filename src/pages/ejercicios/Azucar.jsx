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

// Exponencial con media m usando transformada inversa
function expRandMean(u, mean) {
  // mean > 0; u in (0,1)
  const x = -mean * Math.log(1 - u);
  return x;
}

/* ===== Semillas por fuente (varían siempre con re-simulación) =====
   - Demanda diaria ~ Exponencial(media)
   - Tiempo de entrega (días) ~ Uniforme discreto {1,2} (como tu Python)
*/
const SEED_DEM = 202407;   // demanda
const SEED_LEAD = 99013;   // lead time

export default function Azucar() {
  /* --------- Parámetros por defecto (según tu enunciado) ---------- */
  const [mediaDemanda, setMediaDemanda] = useState("100"); // Kg/día (Exponencial)
  const [capBodega, setCapBodega] = useState("700");       // Kg
  const [costoOrdenar, setCostoOrdenar] = useState("100"); // Bs/orden
  const [costoInv, setCostoInv] = useState("0.1");         // Bs/Kg/día
  const [costoAdq, setCostoAdq] = useState("3.5");         // Bs/Kg
  const [precioVenta, setPrecioVenta] = useState("5.0");   // Bs/Kg
  const [intervaloRev, setIntervaloRev] = useState("7");   // días
  const [diasSim, setDiasSim] = useState("27");            // días a simular
  const [simCount, setSimCount] = useState("3");           // cantidad de simulaciones (1..30)

  // Epoch de semillas
  const [seedEpoch, setSeedEpoch] = useState(
    () => ((Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0)
  );

  const [current, setCurrent] = useState(0);

  const ready = useMemo(() => {
    const numsOk =
      Number(mediaDemanda) > 0 &&
      Number(capBodega) > 0 &&
      Number(costoOrdenar) >= 0 &&
      Number(costoInv) >= 0 &&
      Number(costoAdq) >= 0 &&
      Number(precioVenta) >= 0 &&
      Number(intervaloRev) >= 1 &&
      Number(diasSim) >= 1;
    const simsOk = Number(simCount) > 0 && Number(simCount) <= 30;
    return numsOk && simsOk;
  }, [mediaDemanda, capBodega, costoOrdenar, costoInv, costoAdq, precioVenta, intervaloRev, diasSim, simCount]);

  /* ----------------- Simulación ----------------- */
  const sims = useMemo(() => {
    if (!ready) return [];

    const MEAN = Number(mediaDemanda);
    const CAP  = Number(capBodega);
    const CORD = Number(costoOrdenar);
    const CIN  = Number(costoInv);
    const CADQ = Number(costoAdq);
    const PV   = Number(precioVenta);
    const K    = Number(intervaloRev);
    const D    = Number(diasSim);
    const S    = Number(simCount);

    // Semillas variables por re-simulación
    const baseDem  = (SEED_DEM + (seedEpoch | 0)) | 0;
    const baseLead = (SEED_LEAD ^ ((seedEpoch << 1) | 0)) | 0;

    const out = [];

    for (let s = 0; s < S; s++) {
      const rngDem  = mulberry32(baseDem + s);
      const rngLead = mulberry32(baseLead + s);

      // Estado inicial
      let inventario = CAP;           // stock inicial lleno
      let pedidoPendiente = false;
      let cantidadPedido = 0;
      let tiempoEntregaRest = 0;

      // Estadísticas
      let demandaTotal = 0;
      let demandaInsatis = 0;
      let ingresoBrutoTotal = 0;
      let costoTotal = CAP * CADQ;    // costo del stock inicial (como tu Python)
      let numOrdenes = 0;

      const rows = [];

      for (let d_ = 1; d_ <= D; d_++) {
        const invIni = inventario;

        // Demanda exponencial(media)
        const demanda = expRandMean(rngDem(), MEAN);
        demandaTotal += demanda;

        // Ventas vs. demanda perdida
        let ventas = 0;
        let perdida = 0;
        if (demanda <= inventario) {
          ventas = demanda;
          inventario -= ventas;
        } else {
          ventas = inventario;
          perdida = demanda - inventario;
          inventario = 0;
          demandaInsatis += perdida;
        }

        // Procesar pedido pendiente (llega al cumplirse el plazo)
        let arriboHoy = 0;
        let costoAdqHoy = 0;
        if (pedidoPendiente) {
          tiempoEntregaRest -= 1;
          if (tiempoEntregaRest <= 0) {
            arriboHoy = cantidadPedido;
            inventario += arriboHoy;
            pedidoPendiente = false;
            // Costo de adquisición al llegar
            costoAdqHoy = arriboHoy * CADQ;
            costoTotal += costoAdqHoy;
            if (inventario > CAP) inventario = CAP;
          }
        }

        // Revisión cada K días → pedir hasta llenar la capacidad
        let pedidoHoy = 0;
        let leadAsignado = null;
        let costoOrdenarHoy = 0;
        if (d_ % K === 0 && !pedidoPendiente) {
          const qty = CAP - inventario;
          if (qty > 0) {
            pedidoPendiente = true;
            cantidadPedido = qty;
            // Igual que tu Python: int(uniforme[1,3)) ⇒ 1 ó 2 días
            const lt = 1 + Math.floor(rngLead() * 2); // 1 o 2
            tiempoEntregaRest = lt;
            leadAsignado = lt;
            pedidoHoy = qty;
            numOrdenes += 1;
            costoOrdenarHoy = CORD;
            costoTotal += costoOrdenarHoy;
          }
        }

        // Costos de inventario (promedio de inv. del día)
        const costoInvDia = ((invIni + inventario) / 2) * CIN;
        costoTotal += costoInvDia;

        // Ingresos por ventas
        const ingresoDia = ventas * PV;
        ingresoBrutoTotal += ingresoDia;

        const gananciaAcum = ingresoBrutoTotal - costoTotal;

        rows.push({
          dia: d_,
          invIni,
          demanda,
          ventas,
          perdida,
          pedidoHoy,
          leadAsignado,      // si se generó hoy
          arriboHoy,
          invFin: inventario,
          costoInvDia,
          costoOrdenarHoy,
          costoAdqHoy,
          ingresoDia,
          ingresoAcum: ingresoBrutoTotal,
          costoAcum: costoTotal,
          gananciaAcum,
        });
      }

      out.push({
        simIndex: s,
        resumen: {
          MEAN, CAP, CORD, CIN, CADQ, PV, K, D,
          seedDem: baseDem + s,
          seedLead: baseLead + s,
          demandaTotal,
          demandaInsatis,
          ingresoBrutoTotal,
          costoTotal,
          gananciaNeta: ingresoBrutoTotal - costoTotal,
          numOrdenes,
          capacidadSuficiente: demandaInsatis <= 1e-6, // criterio práctico
        },
        rows,
      });
    }

    return out;
  }, [ready, mediaDemanda, capBodega, costoOrdenar, costoInv, costoAdq, precioVenta, intervaloRev, diasSim, simCount, seedEpoch]);

  // Promedios sobre simulaciones
  const agregados = useMemo(() => {
    if (sims.length === 0) return null;
    const S = sims.length;
    let sumIB = 0, sumDI = 0, sumCT = 0, sumGN = 0, sumNO = 0, okCap = 0;
    for (const s of sims) {
      sumIB += s.resumen.ingresoBrutoTotal;
      sumDI += s.resumen.demandaInsatis;
      sumCT += s.resumen.costoTotal;
      sumGN += s.resumen.gananciaNeta;
      sumNO += s.resumen.numOrdenes;
      if (s.resumen.capacidadSuficiente) okCap += 1;
    }
    return {
      promIB: sumIB / S,
      promDI: sumDI / S,
      promCT: sumCT / S,
      promGN: sumGN / S,
      promNO: sumNO / S,
      tasaCapOK: okCap / S,
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
          <h1 className="hero-title">Gestión de inventario — Azúcar</h1>
          <p className="hero-sub">
            Demanda diaria ~ Exponencial( media = {mediaDemanda} Kg ). Revisión cada {intervaloRev} días, pedido hasta capacidad de bodega.
            Plazo de entrega uniforme {`{1,2}`} días. Ventas perdidas si no hay stock.
          </p>
        </div>
      </header>

      {/* Consigna breve */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Instrucciones del problema</h3>
        </div>
        <div className="panel-body">
          <ol>
            <li>Partir con inventario lleno = capacidad de bodega.</li>
            <li>Demanda ~ exponencial(media). Si no hay stock, la falta es <em>demanda insatisfecha</em>.</li>
            <li>Revisar cada <strong>K</strong> días y ordenar lo necesario para llegar a la capacidad.</li>
            <li>El pedido llega en <strong>LT</strong> días (uniforme 1–2); al llegar se agrega costo de adquisición.</li>
            <li>Costos: ordenar por pedido; inventario por promedio diario; adquisición al arribo; se incluye costo inicial del stock.</li>
          </ol>
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
                    <th>Nombre</th>
                    <th>Sigla</th>
                    <th>Clasificación</th>
                    <th>Unidades</th>
                    <th>Descripción</th>
                </tr>
                </thead>
                <tbody>
                <tr><td>1</td><td>Número máximo de días</td><td>NMD</td><td>Exógena</td><td>Días</td><td>Horizonte de simulación.</td></tr>
                <tr><td>2</td><td>Contador de días</td><td>CD</td><td>Endógena</td><td>Días</td><td>Iteración 1..NMD.</td></tr>
                <tr><td>3</td><td>Demanda de azúcar</td><td>DAZU</td><td>Estado</td><td>Kg/día</td><td>Exponencial(media).</td></tr>
                <tr><td>4</td><td>Aleatorio DAZU</td><td>R(DAZU)</td><td>Estado</td><td>0–1/día</td><td>Uniforme(0,1) para DAZU.</td></tr>
                <tr><td>5</td><td>Pedido de azúcar</td><td>PDAZ</td><td>Estado</td><td>Kg</td><td>Cantidad pedida para llegar a la capacidad.</td></tr>
                <tr><td>6</td><td>Capacidad de bodega</td><td>CBOD</td><td>Exógena</td><td>Kg</td><td>Máximo inventario permitido.</td></tr>
                <tr><td>7</td><td>Inventario de azúcar</td><td>IAZU</td><td>Endógena</td><td>Kg</td><td>Nivel de inventario.</td></tr>
                <tr><td>8</td><td>Tiempo de entrega</td><td>TENT</td><td>Estado</td><td>Días/pedido</td><td>Uniforme {`{1,2}`}.</td></tr>
                <tr><td>9</td><td>Aleatorio TENT</td><td>R(TENT)</td><td>Estado</td><td>0–1/pedido</td><td>Uniforme(0,1) para el lead time.</td></tr>
                <tr><td>10</td><td>Costo de ordenar</td><td>CORD</td><td>Exógena</td><td>Bs/orden</td><td>Costo fijo por pedido.</td></tr>
                <tr><td>11</td><td>Costo de inventario</td><td>CINV</td><td>Exógena</td><td>Bs/(Kg·día)</td><td>Tenencia usando promedio diario.</td></tr>
                <tr><td>12</td><td>Costo unitario de adquisición</td><td>CUA</td><td>Exógena</td><td>Bs/Kg</td><td>Costo del azúcar.</td></tr>
                <tr><td>13</td><td>Precio de venta unitario</td><td>PVU</td><td>Exógena</td><td>Bs/Kg</td><td>Precio de venta del azúcar.</td></tr>
                <tr><td>14</td><td>Costo total</td><td>CTOT</td><td>Endógena</td><td>Bs</td><td>Σ costos (incluye stock inicial).</td></tr>
                <tr><td>15</td><td>Ganancia neta</td><td>GNET</td><td>Endógena</td><td>Bs</td><td>Ingreso bruto − costo total.</td></tr>
                <tr><td>16</td><td>Demanda insatisfecha total</td><td>DINS</td><td>Endógena</td><td>Kg</td><td>Ventas perdidas por falta de stock.</td></tr>
                <tr><td>17</td><td>Costo total de ordenar</td><td>CTORD</td><td>Endógena</td><td>Bs</td><td>Suma de CORD.</td></tr>
                <tr><td>18</td><td>Costo total de inventario</td><td>CTINV</td><td>Endógena</td><td>Bs</td><td>Suma de CINV diarios.</td></tr>
                <tr><td>19</td><td>Costo total de adquisición</td><td>CTADQ</td><td>Endógena</td><td>Bs</td><td>Suma de CUA de los arribos.</td></tr>
                <tr><td>20</td><td>Ingreso bruto total</td><td>IBRU</td><td>Endógena</td><td>Bs</td><td>Suma de ingresos por ventas.</td></tr>
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
              <label>Media demanda (Kg/día)</label>
              <input type="number" min={0.01} step="0.01" value={mediaDemanda} onChange={(e) => setMediaDemanda(e.target.value)} />
            </div>
            <div className="field">
              <label>Capacidad bodega (Kg)</label>
              <input type="number" min={1} step="1" value={capBodega} onChange={(e) => setCapBodega(e.target.value)} />
            </div>
            <div className="field">
              <label>Costo de ordenar (Bs/orden)</label>
              <input type="number" min={0} step="0.01" value={costoOrdenar} onChange={(e) => setCostoOrdenar(e.target.value)} />
            </div>
            <div className="field">
              <label>Costo de inventario (Bs/Kg·día)</label>
              <input type="number" min={0} step="0.001" value={costoInv} onChange={(e) => setCostoInv(e.target.value)} />
            </div>
            <div className="field">
              <label>Costo de adquisición (Bs/Kg)</label>
              <input type="number" min={0} step="0.01" value={costoAdq} onChange={(e) => setCostoAdq(e.target.value)} />
            </div>
            <div className="field">
              <label>Precio de venta (Bs/Kg)</label>
              <input type="number" min={0} step="0.01" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
            </div>
            <div className="field">
              <label>Intervalo de revisión K (días)</label>
              <input type="number" min={1} step="1" value={intervaloRev} onChange={(e) => setIntervaloRev(e.target.value)} />
            </div>
            <div className="field">
              <label>Días a simular</label>
              <input type="number" min={1} step="1" value={diasSim} onChange={(e) => setDiasSim(e.target.value)} />
            </div>
            <div className="field">
              <label>Cantidad de simulaciones (1–30)</label>
              <input type="number" min={1} max={30} value={simCount} onChange={(e) => setSimCount(e.target.value)} />
            </div>
          </div>
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
            {/* Chips resumen */}
            <div className="chips" style={{ justifyContent: "center" }}>
              <span className="pill">Capacidad: <strong>{currentSim.resumen.CAP} Kg</strong></span>
              <span className="pill">Media demanda: <strong>{currentSim.resumen.MEAN} Kg/día</strong></span>
              <span className="pill">K: <strong>{currentSim.resumen.K} días</strong></span>
              <span className="pill">PV: <strong>{money(currentSim.resumen.PV)}</strong></span>
              <span className="pill">CUA: <strong>{money(currentSim.resumen.CADQ)}</strong></span>
              <span className="pill">C. inv: <strong>{money(currentSim.resumen.CIN)}/Kg·día</strong></span>
              <span className="pill">Seed Dem: <strong>{currentSim.resumen.seedDem}</strong></span>
              <span className="pill">Seed LT: <strong>{currentSim.resumen.seedLead}</strong></span>
            </div>

            {/* Tabla diaria */}
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Inv. inicial (Kg)</th>
                    <th>Demanda (Kg)</th>
                    <th>Ventas (Kg)</th>
                    <th>No surtida (Kg)</th>
                    <th>Pedido hoy (Kg)</th>
                    <th>LT asignado</th>
                    <th>Arribo hoy (Kg)</th>
                    <th>Inv. final (Kg)</th>
                    <th>C. inventario</th>
                    <th>C. ordenar</th>
                    <th>C. adquisición</th>
                    <th>Ingreso día</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSim.rows.map((r) => (
                    <tr key={r.dia}>
                      <td>{r.dia}</td>
                      <td>{r.invIni.toFixed(2)}</td>
                      <td>{r.demanda.toFixed(2)}</td>
                      <td>{r.ventas.toFixed(2)}</td>
                      <td>{r.perdida.toFixed(2)}</td>
                      <td>{r.pedidoHoy ? r.pedidoHoy.toFixed(2) : "-"}</td>
                      <td>{r.leadAsignado ?? "-"}</td>
                      <td>{r.arriboHoy ? r.arriboHoy.toFixed(2) : "-"}</td>
                      <td>{r.invFin.toFixed(2)}</td>
                      <td>{money(r.costoInvDia)}</td>
                      <td>{r.costoOrdenarHoy ? money(r.costoOrdenarHoy) : "-"}</td>
                      <td>{r.costoAdqHoy ? money(r.costoAdqHoy) : "-"}</td>
                      <td>{money(r.ingresoDia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen simulación */}
            <h4 style={{ marginTop: 16 }}>
              Ingreso bruto total: <strong>{money(currentSim.resumen.ingresoBrutoTotal)}</strong>{" "}
              — Demanda insatisfecha: <strong>{currentSim.resumen.demandaInsatis.toFixed(2)} Kg</strong>{" "}
              — Costo total: <strong>{money(currentSim.resumen.costoTotal)}</strong>{" "}
              — Ganancia neta: <span className="tag success">{money(currentSim.resumen.gananciaNeta)}</span>{" "}
              — Órdenes: <strong>{currentSim.resumen.numOrdenes}</strong>{" "}
              — ¿Capacidad suficiente?: <strong>{currentSim.resumen.capacidadSuficiente ? "Sí" : "No"}</strong>
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
                    <td>Ingreso bruto total (Bs)</td>
                    <td>{money(agregados.promIB)}</td>
                  </tr>
                  <tr>
                    <td>Demanda insatisfecha (Kg)</td>
                    <td>{agregados.promDI.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Costo total (Bs)</td>
                    <td>{money(agregados.promCT)}</td>
                  </tr>
                  <tr>
                    <td>Ganancia neta (Bs)</td>
                    <td>{money(agregados.promGN)}</td>
                  </tr>
                  <tr>
                    <td>Órdenes por simulación</td>
                    <td>{agregados.promNO.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Capacidad suficiente (tasa)</td>
                    <td>{(agregados.tasaCapOK * 100).toFixed(1)}%</td>
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
