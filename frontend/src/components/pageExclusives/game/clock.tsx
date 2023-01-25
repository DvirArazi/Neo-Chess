import { Box } from "@mui/material";
import { THEME } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";

export default function Clock(props: {
  timeLeftMil: number,
  isTicking: boolean,
  initDateTimeMil: number,
}) {
  const { timeLeftMil, isTicking, initDateTimeMil } = props;

  //I'm not actually using this variable, just need it for rerendering
  const dateTimeMil = new Stateful(initDateTimeMil);

  useEffect(() => {
    if (isTicking) {
      const interval = setInterval(() => {
        dateTimeMil.set(new Date().getTime())
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isTicking]);

  const crntTimeMs = isTicking ?
    timeLeftMil - (new Date().getTime() - initDateTimeMil) :
    timeLeftMil;



  return (<>
    <Box sx={{
      padding: `5px 5px`,
      background: THEME.clock,
      fontSize: `26px`,
      fontFamily: `robotomono`,
      borderRadius: `10px`,
    }}>
      {getTimeString()}
    </Box>
  </>);

  function getTimeString() {
    if (crntTimeMs <= 0) {
      return '00:00';
    }

    const minutes = Math.floor(crntTimeMs / (60 * 1000));
    const seconds = Math.floor(crntTimeMs / 1000) % 60;

    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }
}