import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import Head from 'next/head';
import RpcClient from '../utils/types';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Stateful from '../utils/stateful';

export let SOCKET: RpcClient;

export default function App({ Component, pageProps }: AppProps) {
  const isReady = new Stateful(false);

  useEffect(() => {
    SOCKET = io();

    isReady.set(true);
    return () => {
      SOCKET.close();
    };
  }, []);

  return (
      !isReady.value ? <></> :
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
  );
}