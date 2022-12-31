import { CSSProperties } from "@emotion/serialize";
import { Box } from "@mui/material";
import CssFilterConverter from "css-filter-converter";
import Image from "next/image";
import React from "react";
import { useEffect, useState } from "react";

export default function Icon(props: { path: string, color?: string }) {
  const {path} = props;
  const color = props.color ?? `#000000`;

  const filter = CssFilterConverter.hexToFilter(color).color;

  return (
    <img
      src={`/${path}.svg`}
      style={{
        objectFit: `contain`,
        width: `100%`,
        height: `100%`,
        overflow: `visible`,
        filter: filter,
      }}
    ></img>
  );
}