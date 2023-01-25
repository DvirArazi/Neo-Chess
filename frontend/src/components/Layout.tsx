
import { Box } from "@mui/material";
import { THEME } from "frontend/src/pages/_app";
import Head from "next/head";
import React from "react";
import { ReactNode } from "react";
import TopBar from "./Layout/TopBar";

export default function Layout(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <>
      <style jsx global>{`
        body {
          background: ${THEME.background};
        }
      `}</style>
      <main>
        <TopBar />
        {/* <Box> */}
          {children}
        {/* </Box> */}
      </main>
    </>
  );
}