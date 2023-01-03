import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import Head from 'next/head';
import { SocketClient } from '../utils/types';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Stateful from '../utils/stateful';
import React from 'react';
import { TokenPayload } from 'google-auth-library';
import Cookies from '../utils/cookies';

export let SOCKET: SocketClient = io();
export let COOKIE: Cookies = new Cookies();
export let USER_DATA: Stateful<TokenPayload | undefined>;

export default function App({ Component, pageProps }: AppProps) {

  const isReady = new Stateful(false);
  USER_DATA = new Stateful(undefined);

  useEffect(() => { //TRY TO DELETE THAT, MIGHT NOT BE NEEDED
    SOCKET.on("authenticated", (data) => {
      console.log("has user data!");
      USER_DATA.set(data);
    });

    if (COOKIE.tid != undefined) {
      SOCKET.emit("authenticate", COOKIE.tid);
    }

    isReady.set(true);
    return () => {
      SOCKET.close();
    };
  }, []);

  return (
      <>
      { !isReady.value ? <div></div> :
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