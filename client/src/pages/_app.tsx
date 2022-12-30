import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import Head from 'next/head';
import RpcClient from '../utils/types';

let SOCKET: RpcClient;

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    console.log("echo");
    SOCKET = io();

    // SOCKET.on("blue", () => {
    //   console.log("bla");
    // });

    return () => {
      SOCKET.close();
    };
  }, []);
  return (
    <>
    <Head>
        <title>Neo Chess</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="fonts" />

    </Head>
      <Component {...pageProps} />
    </>
  );
}
