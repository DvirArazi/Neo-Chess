import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { io } from 'socket.io-client'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    console.log("echo");
    const socket = io();

    socket.on("bla", () => {
      console.log("bla");
    });

    return () => {
      socket.close();
    };
  }, []);
  return <Component {...pageProps} />;
}
