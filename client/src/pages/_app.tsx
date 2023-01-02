import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import Head from 'next/head';
import RpcClient from '../utils/types';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Stateful from '../utils/stateful';
import React from 'react';
import { TokenPayload } from 'google-auth-library';

export let SOCKET: RpcClient;
export let USER_DATA: Stateful<TokenPayload | undefined>;

export default function App({ Component, pageProps }: AppProps) {

  const isReady = new Stateful(false);
  USER_DATA = new Stateful(undefined);

  console.log("woop");

  useEffect(() => {
    SOCKET = io();

    SOCKET.on("authenticated", (data) => {
      console.log("has user data!");
      USER_DATA.set(data);
    });

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