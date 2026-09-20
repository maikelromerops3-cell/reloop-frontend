import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Separamos las librerías de terceros del código propio de la app: como estas casi
        // nunca cambian entre despliegues, el navegador de quien ya visitó la web puede
        // reutilizarlas de la caché en vez de volver a descargarlas cada vez que subimos un
        // arreglo — solo hace falta bajar de nuevo el trozo (más pequeño) que sí cambió.
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          icons: ["lucide-react"],
          maps: ["leaflet"],
        },
      },
    },
  },
});
