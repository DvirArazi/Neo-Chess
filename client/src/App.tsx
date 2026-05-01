import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AuthenticatedUser,
  FriendEntry,
  FriendRequest,
  OnlineMatchFound,
} from "../../shared/socket";
import "./App.css";
import { ButtonGroup } from "./ButtonGroup";
import LocalGame, { type LocalTimeControl } from "./LocalGame";
import { Popup } from "./Popup";
import { RangeSlider } from "./RangeSlider";
import {
  clearSessionToken,
  clearStoredAuthenticatedUser,
  getStoredAuthenticatedUser,
  setSessionToken,
  setStoredAuthenticatedUser,
  socket,
} from "./socket";
import { TabPanel } from "./TabPanel";
import { ToggleButtonGroup } from "./ToggleButtonGroup";
import blackQueen from "./assets/images/pieces/black-queen.svg";
import accountIcon from "./assets/images/account.svg";
import googleIcon from "./assets/images/socials/google.svg";

const HOME_PATH = "/";
const LOCAL_GAME_PATH = "/local-game";
const ONLINE_GAME_PATH = "/online-game";
const GOOGLE_AUTH_MESSAGE_TYPE = "neo-chess-google-auth-result";
const RANDOM_OPPONENT_ID = "random";
const DEFAULT_ELO = 1200;
const RATING_RANGE_RADIUS = 500;
const MIN_RATING_RANGE_DISTANCE = 100;
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
  const [selectedOpponentId, setSelectedOpponentId] = useState(RANDOM_OPPONENT_ID);
  const [selectedOnlineTimeControlId, setSelectedOnlineTimeControlId] =
    useState(LOCAL_TIME_CONTROLS[0].id);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [onlineMatchStatus, setOnlineMatchStatus] = useState<string | null>(null);
  const [ratingRange, setRatingRange] = useState<[number, number]>([
    DEFAULT_ELO - RATING_RANGE_RADIUS,
    DEFAULT_ELO + RATING_RANGE_RADIUS,
  ]);
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedUser | null>(() => getStoredAuthenticatedUser());
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPasswordConfirmation, setSignUpPasswordConfirmation] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendUsers, setFriendUsers] = useState<FriendEntry[]>([]);
  const [friendOptions, setFriendOptions] = useState<FriendEntry[]>([]);
  const [hasUnseenRequests, setHasUnseenRequests] = useState(false);
  const [areAccountInputsArmed, setAreAccountInputsArmed] = useState(false);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [accountStatusTone, setAccountStatusTone] = useState<"error" | "success">(
    "success",
  );
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [friendStatusTone, setFriendStatusTone] = useState<"error" | "success">(
    "success",
  );
  const [activeAccountAction, setActiveAccountAction] = useState<
    "logIn" | "signUp" | "logOut" | "google" | null
  >(null);
  const [activeFriendAction, setActiveFriendAction] = useState<string | null>(null);
  const [isOpponentMenuOpen, setIsOpponentMenuOpen] = useState(false);
  const opponentSelectRef = useRef<HTMLDivElement | null>(null);
  const googleAuthPopupRef = useRef<Window | null>(null);
  const googleAuthTimeoutRef = useRef<number | null>(null);

  const fetchFriends = useCallback((options?: {
    search?: string;
    markRequestsSeen?: boolean;
  }, onComplete?: () => void) => {
    if (!authenticatedUser) {
      onComplete?.();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "getFriends",
      {
        search: options?.search ?? friendSearch,
        markRequestsSeen: options?.markRequestsSeen ?? false,
      },
      (response) => {
        if (!response.ok) {
          setFriendStatusTone("error");
          setFriendStatus(response.error);
          onComplete?.();
          return;
        }

        setFriendRequests(response.requests);
        setFriendUsers(response.users);
        if ((options?.search ?? friendSearch).trim().length === 0) {
          setFriendOptions(response.users.filter((user) => user.isFriend));
        }
        setHasUnseenRequests(response.hasUnseenRequests);
        onComplete?.();
      },
    );
  }, [authenticatedUser, friendSearch]);

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
        clearStoredAuthenticatedUser();
        setFriendRequests([]);
        setFriendUsers([]);
        setFriendOptions([]);
        setSelectedOpponentId(RANDOM_OPPONENT_ID);
        setHasUnseenRequests(false);
        return;
      }

      setStoredAuthenticatedUser(data.user);
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
    if (!authenticatedUser) return;

    fetchFriends();
  }, [authenticatedUser, fetchFriends]);

  useEffect(() => {
    const handleOnlineMatchFound = (match: OnlineMatchFound) => {
      setIsWaitingForOpponent(false);
      setOnlineMatchStatus(null);
      setSelectedOnlineTimeControlId(match.timeControlId);
      navigate(ONLINE_GAME_PATH, `?time=${match.timeControlId}`);
    };

    socket.on("onlineMatchFound", handleOnlineMatchFound);
    return () => {
      socket.off("onlineMatchFound", handleOnlineMatchFound);
    };
  });

  useEffect(() => {
    const userElo = authenticatedUser?.elo ?? DEFAULT_ELO;
    setRatingRange([
      userElo - RATING_RANGE_RADIUS,
      userElo + RATING_RANGE_RADIUS,
    ]);
  }, [authenticatedUser?.elo]);

  useEffect(() => {
    if (
      selectedOpponentId !== RANDOM_OPPONENT_ID &&
      !friendOptions.some((friend) => friend.id === selectedOpponentId)
    ) {
      setSelectedOpponentId(RANDOM_OPPONENT_ID);
    }
  }, [friendOptions, selectedOpponentId]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        opponentSelectRef.current &&
        !opponentSelectRef.current.contains(event.target as Node)
      ) {
        setIsOpponentMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);

  useEffect(() => {
    const handleFriendsChanged = () => {
      fetchFriends({ markRequestsSeen: isAccountPopupOpen });
    };

    socket.on("friendsChanged", handleFriendsChanged);
    return () => {
      socket.off("friendsChanged", handleFriendsChanged);
    };
  }, [fetchFriends, isAccountPopupOpen]);

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
      setStoredAuthenticatedUser(data.user);
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
    if (
      route.pathname === HOME_PATH ||
      route.pathname === LOCAL_GAME_PATH ||
      route.pathname === ONLINE_GAME_PATH
    ) return;

    window.history.replaceState({}, "", HOME_PATH);
    const redirectFrame = window.requestAnimationFrame(() => {
      setRoute({ pathname: HOME_PATH, search: "" });
    });

    return () => window.cancelAnimationFrame(redirectFrame);
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
  const selectedOnlineTimeControl = LOCAL_TIME_CONTROLS.find((control) =>
    control.id === selectedOnlineTimeControlId
  ) ?? LOCAL_TIME_CONTROLS[0];
  const selectedOpponentLabel = selectedOpponentId === RANDOM_OPPONENT_ID
    ? "Random opponent"
    : friendOptions.find((friend) => friend.id === selectedOpponentId)?.username ??
      "Random opponent";
  const userElo = authenticatedUser?.elo ?? DEFAULT_ELO;
  const ratingRangeMin = userElo - RATING_RANGE_RADIUS;
  const ratingRangeMax = userElo + RATING_RANGE_RADIUS;

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
    setFriendStatus(null);
    setFriendStatusTone("success");
    setActiveFriendAction(null);
  };

  const openAccountPopup = () => {
    setIsAccountPopupOpen(true);
    if (authenticatedUser) {
      setFriendStatus(null);
      fetchFriends({ markRequestsSeen: true });
    }
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
        setStoredAuthenticatedUser(response.user);
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
        setStoredAuthenticatedUser(response.user);
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
      clearStoredAuthenticatedUser();
      setAuthenticatedUser(null);
      setFriendRequests([]);
      setFriendUsers([]);
      setFriendOptions([]);
      setFriendSearch("");
      setSelectedOpponentId(RANDOM_OPPONENT_ID);
      setHasUnseenRequests(false);
      setAccountStatusTone("success");
      setAccountStatus("Logged out");
    });
  };

  const runFriendAction = (
    actionKey: string,
    emitAction: (
      callback: (response: { ok: true } | { ok: false; error: string }) => void,
    ) => void,
  ) => {
    if (!socket.connected) {
      socket.connect();
    }

    setActiveFriendAction(actionKey);
    setFriendStatus(null);

    emitAction((response) => {
      if (!response.ok) {
        setActiveFriendAction(null);
        setFriendStatusTone("error");
        setFriendStatus(response.error);
        return;
      }

      setFriendStatusTone("success");
      setFriendStatus(null);
      fetchFriends(undefined, () => setActiveFriendAction(null));
    });
  };

  const handleApproveFriendRequest = (requestId: string) => {
    runFriendAction(`approve:${requestId}`, (callback) => {
      socket.emit("approveFriendRequest", { requestId }, callback);
    });
  };

  const handleDenyFriendRequest = (requestId: string) => {
    runFriendAction(`deny:${requestId}`, (callback) => {
      socket.emit("denyFriendRequest", { requestId }, callback);
    });
  };

  const handleSendFriendRequest = (userId: string) => {
    runFriendAction(`add:${userId}`, (callback) => {
      socket.emit("sendFriendRequest", { userId }, callback);
    });
  };

  const handleUnfriend = (userId: string) => {
    runFriendAction(`unfriend:${userId}`, (callback) => {
      socket.emit("unfriend", { userId }, callback);
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

  const handleFindOnlineMatch = (timeControl: LocalTimeControl) => {
    setSelectedOnlineTimeControlId(timeControl.id);
    setIsWaitingForOpponent(true);
    setOnlineMatchStatus(null);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "findOnlineMatch",
      {
        mode: onlineMode,
        timeControlId: timeControl.id,
        opponentId: selectedOpponentId === RANDOM_OPPONENT_ID
          ? null
          : selectedOpponentId,
        ratingMin: ratingRange[0],
        ratingMax: ratingRange[1],
      },
      (response) => {
        if (!response.ok) {
          setOnlineMatchStatus(response.error);
          return;
        }
      },
    );
  };

  const handleCancelOnlineMatch = () => {
    setIsWaitingForOpponent(false);
    setOnlineMatchStatus(null);

    if (!socket.connected) return;
    socket.emit("cancelOnlineMatch", () => {});
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
          onClick={openAccountPopup}
        >
          {authenticatedUser
            ? (
              <span className="app-header__account-name">
                {authenticatedUser.username}
              </span>
            )
            : null}
          <img className="app-header__account-icon" src={accountIcon} alt="" />
          {hasUnseenRequests
            ? <span className="app-header__account-indicator" aria-hidden="true" />
            : null}
        </button>
      </header>

      <div className="app-content">
        {route.pathname === LOCAL_GAME_PATH || route.pathname === ONLINE_GAME_PATH
          ? (
            <LocalGame
              key={route.pathname === ONLINE_GAME_PATH
                ? `online:${selectedOnlineTimeControl.id}`
                : `local:${selectedTimeControl.id}`}
              timeControl={route.pathname === ONLINE_GAME_PATH
                ? selectedOnlineTimeControl
                : selectedTimeControl}
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
                        <div className="home-page__field">
                          <span className="home-page__field-label">VS</span>
                          <div
                            ref={opponentSelectRef}
                            className="home-page__select"
                          >
                            <button
                              type="button"
                              className="home-page__select-button"
                              aria-haspopup="listbox"
                              aria-expanded={isOpponentMenuOpen}
                              onPointerDown={(event) => {
                                event.preventDefault();
                                setIsOpponentMenuOpen((current) => !current);
                              }}
                              onClick={(event) => {
                                if (event.detail === 0) {
                                  setIsOpponentMenuOpen((current) => !current);
                                }
                              }}
                            >
                              <span className="home-page__select-value">
                                {selectedOpponentLabel}
                              </span>
                            </button>
                            {isOpponentMenuOpen
                              ? (
                                <div
                                  className="home-page__select-menu"
                                  role="listbox"
                                  aria-label="Opponent"
                                >
                                  <button
                                    type="button"
                                    className="home-page__select-option"
                                    role="option"
                                    aria-selected={selectedOpponentId ===
                                      RANDOM_OPPONENT_ID}
                                    onPointerDown={(event) => {
                                      event.preventDefault();
                                      setSelectedOpponentId(RANDOM_OPPONENT_ID);
                                      setIsOpponentMenuOpen(false);
                                    }}
                                    onClick={(event) => {
                                      if (event.detail === 0) {
                                        setSelectedOpponentId(RANDOM_OPPONENT_ID);
                                        setIsOpponentMenuOpen(false);
                                      }
                                    }}
                                  >
                                    Random opponent
                                  </button>
                                  {friendOptions.map((friend) => (
                                    <button
                                      type="button"
                                      className="home-page__select-option"
                                      role="option"
                                      aria-selected={selectedOpponentId === friend.id}
                                      key={friend.id}
                                      onPointerDown={(event) => {
                                        event.preventDefault();
                                        setSelectedOpponentId(friend.id);
                                        setIsOpponentMenuOpen(false);
                                      }}
                                      onClick={(event) => {
                                        if (event.detail === 0) {
                                          setSelectedOpponentId(friend.id);
                                          setIsOpponentMenuOpen(false);
                                        }
                                      }}
                                    >
                                      {friend.username}
                                    </button>
                                  ))}
                                </div>
                              )
                              : null}
                          </div>
                        </div>
                        <div className="home-page__field">
                          <span className="home-page__field-label">
                            Rating range
                          </span>
                          <RangeSlider
                            min={ratingRangeMin}
                            max={ratingRangeMax}
                            minDistance={MIN_RATING_RANGE_DISTANCE}
                            value={ratingRange}
                            ariaLabel="Rating range"
                            markers={[
                              {
                                value: ratingRangeMin,
                                label: `${ratingRangeMin}`,
                              },
                              {
                                value: userElo,
                                label: `${userElo}`,
                              },
                              {
                                value: ratingRangeMax,
                                label: `${ratingRangeMax}`,
                              },
                            ]}
                            onChange={setRatingRange}
                          />
                        </div>
                        <ButtonGroup
                          items={LOCAL_TIME_CONTROLS.map((timeControl) => ({
                            text: timeControl.label,
                            subtext: formatTimeControlSubtext(timeControl),
                            onClick: () => handleFindOnlineMatch(timeControl),
                          }))}
                        />
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
        open={isWaitingForOpponent}
        title="Waiting for opponent"
        onClose={handleCancelOnlineMatch}
        closeOnBackdropPress={true}
      >
        <div className="waiting-popup">
          <div className="waiting-popup__spinner" aria-hidden="true" />
          {onlineMatchStatus
            ? <p className="account-popup__status account-popup__status--error">
              {onlineMatchStatus}
            </p>
            : null}
        </div>
      </Popup>

      <Popup
        open={isAccountPopupOpen}
        title={authenticatedUser ? "" : "Account"}
        onClose={closeAccountPopup}
        closeOnBackdropPress={true}
      >
        <div className="account-popup">
          {authenticatedUser
            ? (
              <>
                {friendRequests.length > 0
                  ? (
                    <section className="account-popup__section">
                      <h3 className="account-popup__section-title">Requests</h3>
                      <div className="account-popup__list">
                        {friendRequests.map((request) => (
                          <div className="account-popup__friend-row" key={request.id}>
                            <span className="account-popup__friend-name">
                              {request.username}
                            </span>
                            <div className="account-popup__friend-actions">
                              <button
                                type="button"
                                className="account-popup__icon-button account-popup__icon-button--approve"
                                aria-label={`Approve ${request.username}`}
                                onClick={() => handleApproveFriendRequest(request.id)}
                                disabled={activeFriendAction === `approve:${request.id}`}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="account-popup__icon-button account-popup__icon-button--deny"
                                aria-label={`Deny ${request.username}`}
                                onClick={() => handleDenyFriendRequest(request.id)}
                                disabled={activeFriendAction === `deny:${request.id}`}
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                  : null}
                <section className="account-popup__section">
                  <h3 className="account-popup__section-title">Friends</h3>
                  <input
                    className="account-popup__input"
                    type="search"
                    name="friend_search"
                    placeholder="Search users"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={friendSearch}
                    onChange={(event) => setFriendSearch(event.target.value)}
                  />
                  <div className="account-popup__list account-popup__list--scroll">
                    {friendUsers.length > 0
                      ? friendUsers.map((user) => (
                        <div className="account-popup__friend-row" key={user.id}>
                          <span className="account-popup__friend-name">
                            {user.username}
                          </span>
                          {user.hasPendingRequest ||
                              activeFriendAction === `add:${user.id}`
                            ? (
                              <span className="account-popup__pending-text">
                                Pending response
                              </span>
                            )
                            : user.isFriend
                            ? (
                              <button
                                type="button"
                                className="account-popup__small-button"
                                onClick={() => handleUnfriend(user.id)}
                                disabled={activeFriendAction === `unfriend:${user.id}`}
                              >
                                Unfriend
                              </button>
                            )
                            : (
                              <button
                                type="button"
                                className="account-popup__small-button account-popup__small-button--add"
                                onClick={() => handleSendFriendRequest(user.id)}
                                disabled={activeFriendAction === `add:${user.id}`}
                              >
                                Add
                              </button>
                            )}
                        </div>
                      ))
                      : (
                        <p className="account-popup__empty">
                          {friendSearch.trim().length > 0
                            ? "No users found"
                            : "No friends yet"}
                        </p>
                      )}
                  </div>
                </section>
                {friendStatus
                  ? (
                    <p
                      className={[
                        "account-popup__status",
                        friendStatusTone === "error"
                          ? "account-popup__status--error"
                          : "account-popup__status--success",
                      ].join(" ")}
                    >
                      {friendStatus}
                    </p>
                  )
                  : null}
                <div className="account-popup__divider" aria-hidden="true" />
                <button
                  type="button"
                  className="account-popup__button"
                  onClick={handleLogOut}
                  disabled={activeAccountAction !== null}
                >
                  Log Out
                </button>
              </>
            )
            : (
              <>
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
                  onChange={(event) =>
                    setSignUpPasswordConfirmation(event.target.value)}
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
                  <span
                    className="account-popup__button-icon-slab"
                    aria-hidden="true"
                  >
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
              </>
            )}
        </div>
      </Popup>
    </div>
  );
}
