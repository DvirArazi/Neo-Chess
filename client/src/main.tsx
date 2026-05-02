import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { preloadPieceImages } from "./chess/pieceAssets.ts";

const root = createRoot(document.getElementById("root")!);

async function clearStaleServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );
  } catch {
    // A stale worker should not block the app from rendering.
  }
}

async function bootstrap() {
  await clearStaleServiceWorkers();
  await preloadPieceImages();

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
