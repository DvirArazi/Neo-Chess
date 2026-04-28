import { useEffect, useRef, useState } from "react";
import type { AuthenticatedUser } from "../../shared/socket";
import "./App.css";
import { ButtonGroup } from "./ButtonGroup";
import LocalGame, { type LocalTimeControl } from "./LocalGame";
import { Popup } from "./Popup";
import { clearSessionToken, setSessionToken, socket } from "./socket";
import { TabPanel } from "./TabPanel";
import { ToggleButtonGroup } from "./ToggleButtonGroup";
import blackQueen from "./assets/images/pieces/black-queen.svg";
import accountIcon from "./assets/images/account.svg";
import googleIcon from "./assets/images/socials/google.svg";

const HOME_PATH = "/";
const LOCAL_GAME_PATH = "/local-game";
const GOOGLE_AUTH_MESSAGE_TYPE = "neo-chess-google-auth-result";
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
type GoogleAuthMessage =
  | {
    type: typeof GOOGLE_AUTH_MESSAGE_TYPE;
    ok: true;
    user: AuthenticatedUser;
    sessionToken: string;
  }
  | {
    type: typeof GOOGLE_AUTH_MESSAGE_TYPE;
    ok: false;
    error: string;
  };

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
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedUser | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPasswordConfirmation, setSignUpPasswordConfirmation] = useState("");
  const [areAccountInputsArmed, setAreAccountInputsArmed] = useState(false);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [accountStatusTone, setAccountStatusTone] = useState<"error" | "success">(
    "success",
  );
  const [activeAccountAction, setActiveAccountAction] = useState<
    "logIn" | "signUp" | "logOut" | "google" | null
  >(null);
  const googleAuthPopupRef = useRef<Window | null>(null);
  const googleAuthTimeoutRef = useRef<number | null>(null);

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
    const handleAuthStateChanged = (data: { user: AuthenticatedUser | null }) => {
      setAuthenticatedUser(data.user);
      if (data.user === null) {
        clearSessionToken();
      }
    };

    socket.on("authStateChanged", handleAuthStateChanged);
    if (!socket.connected && !socket.active) {
      socket.connect();
    }

    return () => {
      socket.off("authStateChanged", handleAuthStateChanged);
    };
  }, []);

  useEffect(() => {
    const serverOrigin = new URL(import.meta.env.VITE_SERVER_URL).origin;

    const clearGooglePopupWatcher = () => {
      if (googleAuthTimeoutRef.current !== null) {
        window.clearTimeout(googleAuthTimeoutRef.current);
        googleAuthTimeoutRef.current = null;
      }
      googleAuthPopupRef.current = null;
    };

    
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== serverOrigin) {
        return;
      }

      const data = event.data as GoogleAuthMessage | null;
      if (!data || data.type !== GOOGLE_AUTH_MESSAGE_TYPE) {
        return;
      }

      clearGooglePopupWatcher();
      setActiveAccountAction(null);

      if (!data.ok) {
        setAccountStatusTone("error");
        setAccountStatus(data.error);
        return;
      }

      setSessionToken(data.sessionToken);
      setAuthenticatedUser(data.user);
      setIsAccountPopupOpen(false);
      setLoginUsername("");
      setLoginPassword("");
      setSignUpUsername("");
      setSignUpPassword("");
      setSignUpPasswordConfirmation("");
      setAreAccountInputsArmed(false);
      setAccountStatus(null);
      setAccountStatusTone("success");

      if (socket.connected || socket.active) {
        socket.disconnect();
      }
      socket.connect();
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearGooglePopupWatcher();
    };
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

  const resetAccountForms = () => {
    setLoginUsername("");
    setLoginPassword("");
    setSignUpUsername("");
    setSignUpPassword("");
    setSignUpPasswordConfirmation("");
    setAreAccountInputsArmed(false);
    setAccountStatus(null);
    setAccountStatusTone("success");
    setActiveAccountAction(null);
  };

  const closeAccountPopup = () => {
    setIsAccountPopupOpen(false);
    resetAccountForms();
  };

  const handleLogIn = () => {
    setActiveAccountAction("logIn");
    setAccountStatus(null);
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "logIn",
      {
        username: loginUsername,
        password: loginPassword,
      },
      (response) => {
        setActiveAccountAction(null);

        if (!response.ok) {
          setAccountStatusTone("error");
          setAccountStatus(response.error);
          return;
        }

        setSessionToken(response.sessionToken);
        setAuthenticatedUser(response.user);
        closeAccountPopup();
      },
    );
  };

  const handleSignUp = () => {
    setActiveAccountAction("signUp");
    setAccountStatus(null);
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "signUp",
      {
        username: signUpUsername,
        password: signUpPassword,
        passwordConfirmation: signUpPasswordConfirmation,
      },
      (response) => {
        setActiveAccountAction(null);

        if (!response.ok) {
          setAccountStatusTone("error");
          setAccountStatus(response.error);
          return;
        }

        setSessionToken(response.sessionToken);
        setAuthenticatedUser(response.user);
        closeAccountPopup();
      },
    );
  };

  const handleLogOut = () => {
    setActiveAccountAction("logOut");
    setAccountStatus(null);
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("logOut", (response) => {
      setActiveAccountAction(null);

      if (!response.ok) {
        setAccountStatusTone("error");
        setAccountStatus(response.error);
        return;
      }

      clearSessionToken();
      setAuthenticatedUser(null);
      setAccountStatusTone("success");
      setAccountStatus("Logged out");
    });
  };

  const handleContinueWithGoogle = () => {
    if (googleAuthPopupRef.current) {
      googleAuthPopupRef.current.focus();
      return;
    }

    setAccountStatus(null);
    setAccountStatusTone("success");

    const authUrl = new URL("/auth/google/start", import.meta.env.VITE_SERVER_URL);
    authUrl.searchParams.set("origin", window.location.origin);

    const popup = window.open(
      authUrl.toString(),
      "neo-chess-google-auth",
      "popup=yes,width=520,height=680",
    );

    if (!popup) {
      setAccountStatusTone("error");
      setAccountStatus("Google sign-in popup was blocked");
      return;
    }

    googleAuthPopupRef.current = popup;
    setActiveAccountAction("google");

    if (googleAuthTimeoutRef.current !== null) {
      window.clearTimeout(googleAuthTimeoutRef.current);
    }

    googleAuthTimeoutRef.current = window.setTimeout(() => {
      googleAuthTimeoutRef.current = null;
      googleAuthPopupRef.current = null;
      setActiveAccountAction((current) => current === "google" ? null : current);
    }, 2 * 60 * 1000);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand" aria-label="Neo Chess">
          <img className="app-brand__icon" src={blackQueen} alt="" />
          <span className="app-brand__name">Neo Chess</span>
        </div>

        <button
          type="button"
          className="app-header__account-link"
          aria-label={
            authenticatedUser
              ? `Account (${authenticatedUser.username})`
              : "Account"
          }
          onClick={() => setIsAccountPopupOpen(true)}
        >
          {authenticatedUser
            ? (
              <span className="app-header__account-name">
                {authenticatedUser.username}
              </span>
            )
            : null}
          <img className="app-header__account-icon" src={accountIcon} alt="" />
        </button>
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

      <Popup
        open={isAccountPopupOpen}
        title="Account"
        onClose={closeAccountPopup}
        closeOnBackdropPress={true}
      >
        <div className="account-popup">
          {authenticatedUser
            ? (
              <>
                <p className="account-popup__signed-in">
                  Signed in as {authenticatedUser.username}
                </p>
                <button
                  type="button"
                  className="account-popup__button"
                  onClick={handleLogOut}
                  disabled={activeAccountAction !== null}
                >
                  Log Out
                </button>
                <div className="account-popup__divider" aria-hidden="true" />
              </>
            )
            : null}
          <input
            className="account-popup__input"
            type="text"
            name="signup_username"
            placeholder="Enter username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            readOnly={!areAccountInputsArmed}
            onPointerDown={() => setAreAccountInputsArmed(true)}
            onFocus={() => setAreAccountInputsArmed(true)}
            value={signUpUsername}
            onChange={(event) => setSignUpUsername(event.target.value)}
          />
          <input
            className="account-popup__input"
            type="password"
            name="signup_password"
            placeholder="Enter password"
            autoComplete="new-password"
            readOnly={!areAccountInputsArmed}
            onPointerDown={() => setAreAccountInputsArmed(true)}
            onFocus={() => setAreAccountInputsArmed(true)}
            value={signUpPassword}
            onChange={(event) => setSignUpPassword(event.target.value)}
          />
          <input
            className="account-popup__input"
            type="password"
            name="signup_password_confirmation"
            placeholder="Re-enter password"
            autoComplete="new-password"
            readOnly={!areAccountInputsArmed}
            onPointerDown={() => setAreAccountInputsArmed(true)}
            onFocus={() => setAreAccountInputsArmed(true)}
            value={signUpPasswordConfirmation}
            onChange={(event) => setSignUpPasswordConfirmation(event.target.value)}
          />
          <button
            type="button"
            className="account-popup__button"
            onClick={handleSignUp}
            disabled={activeAccountAction !== null}
          >
            Sign Up
          </button>

          <div className="account-popup__divider" aria-hidden="true" />

          <input
            className="account-popup__input"
            type="text"
            name="login_username"
            placeholder="Enter username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            readOnly={!areAccountInputsArmed}
            onPointerDown={() => setAreAccountInputsArmed(true)}
            onFocus={() => setAreAccountInputsArmed(true)}
            value={loginUsername}
            onChange={(event) => setLoginUsername(event.target.value)}
          />
          <input
            className="account-popup__input"
            type="password"
            name="login_password"
            placeholder="Enter password"
            autoComplete="new-password"
            readOnly={!areAccountInputsArmed}
            onPointerDown={() => setAreAccountInputsArmed(true)}
            onFocus={() => setAreAccountInputsArmed(true)}
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
          />
          <button
            type="button"
            className="account-popup__button"
            onClick={handleLogIn}
            disabled={activeAccountAction !== null}
          >
            Log In
          </button>

          <div className="account-popup__divider" aria-hidden="true" />

          <button
            type="button"
            className="account-popup__button account-popup__button--google"
            onClick={handleContinueWithGoogle}
            disabled={activeAccountAction !== null}
          >
            <span className="account-popup__button-icon-slab" aria-hidden="true">
              <img
                className="account-popup__button-icon"
                src={googleIcon}
                alt=""
              />
            </span>
            <span>Continue with Google</span>
          </button>
          <button type="button" className="account-popup__button">
            Continue with Facebook
          </button>
          {accountStatus
            ? (
              <p
                className={[
                  "account-popup__status",
                  accountStatusTone === "error"
                    ? "account-popup__status--error"
                    : "account-popup__status--success",
                ].join(" ")}
              >
                {accountStatus}
              </p>
            )
            : null}
        </div>
      </Popup>
    </div>
  );
}
