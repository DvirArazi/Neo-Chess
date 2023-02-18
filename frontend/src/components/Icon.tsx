import { Box, SvgIcon } from "@mui/material";
import React, { Suspense, useEffect, useRef, useState } from "react";

import { IconName, iconNameToPath } from "frontend/src/utils/types/iconName";
import { resolve } from "path";

export const SVG_CACHE: Record<string, string | undefined> = {};
export const LOCKS: string[] = [];
// let mipmip: { key: string, value: string }[] = [];
// let count_delete = 0;

export default function Icon(props: {
  name: IconName,
  fill?: string,
  side?: number
}): JSX.Element {
  const { name, fill, side } = props;
  const sideStr = side !== undefined ? `${props.side}px` : `100%`;

  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    loadSvg(`/svgs/${iconNameToPath(name)}.svg`).then((svg) => {
      setSvg(svg);
    });
  }, [name]);

  if (svg === null) return <></>;

  return <Box
    sx={{
      display: `flex`,
      alignItems: `center`,
      justifyContent: `center`,

      width: sideStr,
      height: sideStr,

      'svg': {
        width: `100%`,
        height: `100%`,
        fill: fill,
      },
    }}
    dangerouslySetInnerHTML={{ __html: svg }}
  />
}

async function loadSvg(url: string): Promise<string> {
  const svg = SVG_CACHE[url];

  if (svg !== undefined) return Promise.resolve(svg);

  if (!LOCKS.includes(url)) {
    LOCKS.push(url);

    const res = await fetch(url);
    const newSvg = await res.text();
    SVG_CACHE[url] = newSvg;
    LOCKS.splice(LOCKS.indexOf(url), 1);
    return newSvg;
  }

  await new Promise(r=>setTimeout(r, 10));
  return await loadSvg(url);
}