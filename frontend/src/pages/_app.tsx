import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import Head from 'next/head';
import { WebSocketClient } from '../utils/types/webSocket';
import Stateful from '../utils/tools/stateful';
import { TokenPayload } from 'google-auth-library';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AAD_COOKIE } from '../utils/tools/cookies';
import { useRouter } from 'next/router';
import { LIGHT_THEME } from 'frontend/src/utils/tools/theme';
import { Theme } from 'frontend/src/utils/types/theme';
import React from 'react';
import { UserViewData } from 'shared/types/general';
import { ThemeProvider } from '@emotion/react';
import Layout from 'frontend/src/components/Layout';
import IconLinks from 'frontend/src/components/IconLinks';

export let SOCKET: WebSocketClient;
export let WINDOW_WIDTH: number;
export let USER_DATA: UserViewData | undefined;
export let SET_USER_DATA: Dispatch<SetStateAction<UserViewData | undefined>>;
export let THEME: Theme;
export let SET_THEME: Dispatch<SetStateAction<Theme>>;

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const isReady = new Stateful(false);

  let setWindowWidth: Dispatch<SetStateAction<number>>;
  [WINDOW_WIDTH, setWindowWidth] = useState<number>(0);
  [USER_DATA, SET_USER_DATA] = useState<UserViewData | undefined>(undefined);
  [THEME, SET_THEME] = useState(LIGHT_THEME);

  useEffect(() => {
    SOCKET = io();

    SOCKET.on("signedIn", (aad, data) => {
      SOCKET.emit("removeKey", aad);
      AAD_COOKIE.set(aad);
      SET_USER_DATA(data);
    });

    SOCKET.on("autoSignedIn", (data) => {
      // console.log('auto signed in')
      SET_USER_DATA(data);
    });

    SOCKET.on("signedOut", () => {
      AAD_COOKIE.set(undefined);
      SET_USER_DATA(undefined);
    });

    SOCKET.on("createdGame", (path) => {
      router.push(`/game/${path}`);
    });

    const aad = AAD_COOKIE.get();
    if (aad !== undefined && USER_DATA === undefined) {
      // console.log('auto sign in');
      SOCKET.emit("autoSignIn", aad);
    }

    setWindowWidth(window.innerWidth);
    window.onresize = () => {
      setWindowWidth(window.innerWidth);
    }

    isReady.set(true);
    return () => {
      SOCKET.off("signedIn");
      SOCKET.off("autoSignedIn");
      SOCKET.off("signedOut");
      SOCKET.off("createdGame");

      SOCKET.close();
    };
  }, []);

  return (
    <>
      {!isReady.value ? <div></div> :
        <>
          <Head>
            <title>Neo Chess</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="referrer" content="no-referrer-when-downgrade" />
            <link rel="icon" href="/favicon.ico" />
            <link rel="preload" as="image/svg+xml" href="plus"/>
            <IconLinks/>
          </Head>
          <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID!}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </GoogleOAuthProvider>
        </>
      }
    </>
  );
}