import { CSSProperties } from "@emotion/serialize";
import { Box } from "@mui/material";
import Image from "next/image";
import React from "react";
import { useEffect, useState } from "react";

export default function Icon(props: { path: string, isGrayed?: boolean }) {
  const {path} = props;
  const isGrayed = props.isGrayed ?? false;

  return (
    <img
      src={`/${path}.svg`}
      style={{
        objectFit: `contain`,
        width: `100%`,
        height: `100%`,
        overflow: `visible`,
        filter: isGrayed ?
          `invert(54%) sepia(6%) saturate(0%) hue-rotate(247deg) brightness(92%) contrast(88%)` : 
          `none`,
      }}
    ></img>
  );
}