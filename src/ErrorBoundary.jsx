import React from "react";

// Si algo dentro de la app revienta durante el renderizado, React normalmente se queda con una
// pantalla en blanco (solo se ve el color de fondo del <html>). Esto captura ese fallo y muestra
// el error de verdad en pantalla, para poder diagnosticarlo sin herramientas de desarrollador
// (útil sobre todo desde el móvil, donde no hay consola a mano).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", background: "#FFF8EC", color: "#1A1A1A",
          fontFamily: "Arial, Helvetica, sans-serif", padding: 24,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 40, margin: "0 0 8px" }}>⚠️</p>
          <p style={{ fontSize: 18, fontWeight: 900, margin: "0 0 12px" }}>Algo se ha roto al cargar Ropelin</p>
          <div style={{
            background: "#fff", border: "2px solid #1A1A1A", borderRadius: 12, padding: 16,
            maxWidth: 560, width: "100%", textAlign: "left", overflowX: "auto",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px", color: "#FF4D8D" }}>
              {String(this.state.error?.message || this.state.error)}
            </p>
            <pre style={{ fontSize: 10, color: "#5A5450", whiteSpace: "pre-wrap", margin: 0 }}>
              {this.state.error?.stack || ""}
            </pre>
          </div>
          <p style={{ fontSize: 12, color: "#8A7FA0", marginTop: 16 }}>
            Haz una captura de esta pantalla y mándasela a soporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16, border: "2px solid #1A1A1A", background: "linear-gradient(135deg, #FF4D8D, #FF8A4D)",
              color: "#1A1A1A", borderRadius: 12, padding: "10px 20px", fontWeight: 800, fontSize: 13, cursor: "pointer",
            }}
          >
            Volver a intentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
