import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import Head from 'next/head';
import { SocketClient } from '../utils/types';
import Stateful from '../utils/stateful';
import React from 'react';
import { TokenPayload } from 'google-auth-library';
import Script from 'next/script';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AAD_COOKIE } from '../utils/cookies';

export let SOCKET: SocketClient;
export let USER_DATA: Stateful<TokenPayload | undefined>;

export default function App({ Component, pageProps }: AppProps) {

  const isReady = new Stateful(false);
  USER_DATA = new Stateful(undefined);

  useEffect(() => {
    SOCKET = io();

    SOCKET.on("signedIn", (aad, data) => {
      console.log(`data: ${data.iss}`);
      AAD_COOKIE.set(aad);
      USER_DATA.set(data);
    });

    SOCKET.on("autoSignedIn", (data) => {
      console.log('auto signed in')
      USER_DATA.set(data);
    });

    SOCKET.on("signedOut", () => {
      AAD_COOKIE.set(undefined);
      USER_DATA.set(undefined);
    });

    const aad = AAD_COOKIE.get();
    if (aad != undefined) {
      console.log('auto sign in');
      SOCKET.emit("autoSignIn", aad);
    }

    isReady.set(true);
    return () => {
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
          </Head>
          <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID!}>
            <Component {...pageProps} />
          </GoogleOAuthProvider>
        </>
      }
    </>
  );
}