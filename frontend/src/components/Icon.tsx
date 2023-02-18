import { Box, SvgIcon } from "@mui/material";
import React, { Suspense, useEffect, useRef, useState } from "react";

import { IconName, iconNameToPath } from "frontend/src/utils/types/iconName";

const SVG_CACHE: { [url: string]: string } = {};

export default function Icon(props: {
  name: IconName,
  filter?: string,
  side?: number
}): JSX.Element {
  const { name, filter, side } = props;
  const sideStr = side !== undefined ? `${props.side}px` : `100%`;

  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    loadSvg(`/svgs/${iconNameToPath(name)}.svg`).then((svg)=>{
      setSvg(svg);
    });
  }, []);

  if (svg === null) return <></>;

  return <Box
      style={{
        pointerEvents: `none`,
        userSelect: `none`,
        width: `100%`,
        height: `100%`,
        // filter: filter !== undefined ? filter : 'none',
        // fill: `red`,
      }}
      dangerouslySetInnerHTML={{__html: svg}}
    />
}

async function loadSvg(url: string): Promise<string> {
  if (SVG_CACHE[url] !== undefined) {
    return Promise.resolve(SVG_CACHE[url]);
  }

  const res = await fetch(url);
  const svg = await res.text();
  SVG_CACHE[url] = svg;
  return svg;
}