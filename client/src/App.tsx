import { useEffect } from "react";
import "./App.css";
import LocalGame from "./LocalGame";
import blackQueen from "./assets/images/pieces/black-queen.svg";
import accountIcon from "./assets/images/account.svg";

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

        <a href="#" className="app-header__account-link" aria-label="Account">
          <img className="app-header__account-icon" src={accountIcon} alt="" />
        </a>
      </header>

      <div className="app-content">
        <LocalGame />
      </div>
    </div>
  );
}
