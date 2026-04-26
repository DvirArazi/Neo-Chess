import { useEffect, useState } from "react";
import "./App.css";
import { ButtonGroup } from "./ButtonGroup";
import LocalGame, { type LocalTimeControl } from "./LocalGame";
import { TabPanel } from "./TabPanel";
import { ToggleButtonGroup } from "./ToggleButtonGroup";
import blackQueen from "./assets/images/pieces/black-queen.svg";
import accountIcon from "./assets/images/account.svg";

const HOME_PATH = "/";
const LOCAL_GAME_PATH = "/local-game";
const LOCAL_TIME_CONTROLS: LocalTimeControl[] = [
  { id: "bullet", label: "Bullet", initialMs: 2 * 60 * 1000, incrementMs: 1000 },
  { id: "blitz", label: "Blitz", initialMs: 5 * 60 * 1000, incrementMs: 3000 },
  { id: "rapid", label: "Rapid", initialMs: 10 * 60 * 1000, incrementMs: 5000 },
  { id: "classical", label: "Classical", initialMs: 30 * 60 * 1000, incrementMs: 20000 },
  { id: "unlimited", label: "Unlimited", initialMs: Number.POSITIVE_INFINITY, incrementMs: 0, isUnlimited: true },
];

type RouteState = {
  pathname: string;
  search: string;
};

type HomeTab = "online" | "local";
type OnlineMode = "rated" | "casual";

function formatTimeControlSubtext(timeControl: LocalTimeControl): string {
  if (timeControl.isUnlimited) return "∞";

  return `${Math.round(timeControl.initialMs / 60000)}m|${
    Math.round(timeControl.incrementMs / 1000)
  }s`;
}

export function App() {
  const [route, setRoute] = useState<RouteState>(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));
  const [homeTab, setHomeTab] = useState<HomeTab>("online");
  const [onlineMode, setOnlineMode] = useState<OnlineMode>("rated");

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

  useEffect(() => {
    const handlePopState = () => {
      setRoute({
        pathname: window.location.pathname,
        search: window.location.search,
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (route.pathname === HOME_PATH || route.pathname === LOCAL_GAME_PATH) return;

    window.history.replaceState({}, "", HOME_PATH);
    setRoute({ pathname: HOME_PATH, search: "" });
  }, [route.pathname]);

  const navigate = (nextPathname: string, nextSearch = "") => {
    if (
      nextPathname === route.pathname &&
      nextSearch === route.search
    ) {
      return;
    }

    window.history.pushState({}, "", `${nextPathname}${nextSearch}`);
    setRoute({ pathname: nextPathname, search: nextSearch });
  };

  const selectedTimeControl = (() => {
    const timeControlId = new URLSearchParams(route.search).get("time");
    return LOCAL_TIME_CONTROLS.find((control) => control.id === timeControlId) ??
      LOCAL_TIME_CONTROLS[0];
  })();

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
        {route.pathname === LOCAL_GAME_PATH
          ? (
            <LocalGame
              key={selectedTimeControl.id}
              timeControl={selectedTimeControl}
            />
          )
          : (
            <main className="home-page">
              <TabPanel
                activeTabId={homeTab}
                onChange={(tabId) => setHomeTab(tabId as HomeTab)}
                items={[
                  {
                    id: "online",
                    label: "Online",
                    content: (
                      <section className="home-page__panel">
                        <h1 className="home-page__title">Online Game</h1>
                        <ToggleButtonGroup
                          ariaLabel="Game type"
                          value={onlineMode}
                          onChange={(value) => setOnlineMode(value as OnlineMode)}
                          items={[
                            { label: "Rated", value: "rated" },
                            { label: "Casual", value: "casual" },
                          ]}
                        />
                        <p className="home-page__message">
                          Online settings will go here.
                        </p>
                      </section>
                    ),
                  },
                  {
                    id: "local",
                    label: "Local",
                    content: (
                      <section className="home-page__panel">
                        <h1 className="home-page__title">Local Game</h1>
                        <ButtonGroup
                          items={LOCAL_TIME_CONTROLS.map((timeControl) => ({
                            text: timeControl.label,
                            subtext: formatTimeControlSubtext(timeControl),
                            onClick: () =>
                              navigate(
                                LOCAL_GAME_PATH,
                                `?time=${timeControl.id}`,
                              ),
                          }))}
                        />
                      </section>
                    ),
                  },
                ]}
              />
            </main>
          )}
      </div>
    </div>
  );
}
