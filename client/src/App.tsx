import { useEffect } from "react";
import "./App.css";
import LocalGame from "./LocalGame";
import blackQueen from "./assets/images/pieces/black-queen.svg";

export function App() {
  useEffect(() => {
    document.title = "Neo Chess";

    let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.type = "image/svg+xml";
    favicon.href = blackQueen;
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand" aria-label="Neo Chess">
          <img className="app-brand__icon" src={blackQueen} alt="" />
          <span className="app-brand__name">Neo Chess</span>
        </div>

        <button type="button" className="app-header__account-button">
          Account
        </button>
      </header>

      <div className="app-content">
        <LocalGame />
      </div>
    </div>
  );
}
