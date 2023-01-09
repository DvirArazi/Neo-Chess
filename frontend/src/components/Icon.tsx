import React from "react";

export default function Icon(props: { path: string, color?: string | undefined, side?: number }) {
  const {path, color} = props;
  const side = props.side !== undefined ? `${props.side}px` : `100%`;

  return (
    <>
      {
        color !== undefined ?
        <div style={{
          width: side,
          height: side,
          display: `inline-block`,
          
          WebkitMask: `url(/${path}.svg) no-repeat 50% 50%`,
          mask: `url(/${path}.svg) no-repeat 50% 50%`,
          WebkitMaskSize: `cover`,
          maskSize: `cover`,

          backgroundColor: color,
        }}>
        </div> :
        <img src={`/${path}.svg`}></img>
      } 
    </>
  );
}

export enum SvgNames {
  history
}