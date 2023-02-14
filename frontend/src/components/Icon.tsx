import { Box, SvgIcon } from "@mui/material";
import React, { Suspense, useEffect, useRef, useState } from "react";

import { IconName, iconNameToPath } from "frontend/src/utils/types/iconName";

export default function Icon(props: {
  name: IconName,
  filter?: string,
  side?: number
}): JSX.Element {
  const { name, filter, side } = props;
  const sideStr = side !== undefined ? `${props.side}px` : `100%`;

  return <Box sx={{
    width: sideStr,
    height: sideStr,
    pointerEvents: `none`,
    userSelect: `none`,
  }}>
    <img crossOrigin="anonymous"
      style={{
        width: `100%`,
        height: `100%`,
        filter: filter !== undefined ? filter : 'none', 
      }}
      src={`/svgs/${iconNameToPath(name)}.svg`}
    />
  </Box>
}