import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", background: "#FFF8EC", color: "#1A1A1A",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Helvetica Neue', Arial, sans-serif", textAlign: "center", padding: 24,
    }}>
      <p style={{ fontSize: 64, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #FF4D8D, #FF8A4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>404</p>
      <p style={{ fontSize: 16, fontWeight: 700, margin: "8px 0" }}>Esta página no existe</p>
      <p style={{ fontSize: 13, color: "#8A7FA0", marginBottom: 24 }}>Puede que el enlace esté mal escrito o ya no exista.</p>
      <Link
        to="/"
        style={{
          background: "linear-gradient(135deg, #FF4D8D, #FF8A4D)", color: "#1A1A1A",
          padding: "12px 24px", borderRadius: 14, fontWeight: 700, fontSize: 13,
          textDecoration: "none", border: "2px solid #1A1A1A",
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
