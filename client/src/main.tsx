import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { preloadPieceImages } from "./chess/pieceAssets.ts";

const root = createRoot(document.getElementById("root")!);

async function bootstrap() {
  await preloadPieceImages();

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
