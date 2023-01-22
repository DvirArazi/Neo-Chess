import { Box } from "@mui/material";
import React from "react";

export default function Icon(props: { path: string, color?: string | undefined, side?: number }) {
  const {path, color} = props;
  const side = props.side !== undefined ? `${props.side}px` : `100%`;

  return (
    <Box sx={{
      width: side,
      height: side,
      pointerEvents: `none`,
      userSelect: `none`,
    }}>
      {
        color !== undefined ?
        <div style={{
          width: `100%`,
          height: `100%`,
          
          WebkitMask: `url(/${path}.svg) no-repeat 50% 50%`,
          mask: `url(/${path}.svg) no-repeat 50% 50%`,
          WebkitMaskSize: `cover`,
          maskSize: `cover`,

          backgroundColor: color,
        }}>
        </div> :
        <img 
          style={{
            width: `100%`,
            height: `100%`,
          }}
          src={`/svgs/${path}.svg`}
        ></img>
      } 
    </Box>
  );
}

export enum SvgNames {
  history
}