import React from "react";

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
        fill: "#808080",
        filter: isGrayed ? "invert(47%) sepia(0%) saturate(2884%) hue-rotate(146deg) brightness(108%) contrast(87%)" : "none",
      }}
    />
  );
}