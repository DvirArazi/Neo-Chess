
import { Box } from "@mui/material";
import Head from "next/head";
import React from "react";
import { ReactNode } from "react";
import TopBar from "./Layout/TopBar";

export default function Layout(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <>
      <main>
        <TopBar />
        <Box sx={{
          // margin: `auto`,
          // maxWidth: `500px`,
          // display: `flex`,
          // flexDirection: `row`,
          // justifyContent: `center`,
        }}>
          {/* <Box sx={{
            flex: `1`,
          }}> */}
          {children}
          {/* </Box> */}
        </Box>
      </main>
    </>
  );
}