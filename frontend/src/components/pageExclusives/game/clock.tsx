import { Box } from "@mui/material";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";

export default function Clock(props: {
  timeLeftMil: number,
  isTicking: boolean,
  initDateTimeMil: number,
}) {
  const { timeLeftMil, isTicking, initDateTimeMil } = props;

  //I'm not actually using this variable cause it doe
  const dateTimeMil = new Stateful(new Date().getTime());

  useEffect(() => {
    if (isTicking) {
      const interval = setInterval(() => {
        dateTimeMil.set(new Date().getTime())
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isTicking]);

  const crntMillis = isTicking ?
    timeLeftMil - (new Date().getTime() - initDateTimeMil) :
    timeLeftMil;

  const minutes = Math.floor(crntMillis / (60 * 1000));
  const seconds = Math.floor(crntMillis / 1000) % 60;

  return (<>
    <Box sx={{
      padding: `5px 5px`,
      background: `lightgray`,
      fontSize: `24px`,
      fontFamily: `roboto-regular`
    }}>
      {minutes < 10 ? '0' : ''}{minutes}:{seconds < 10 ? '0' : ''}{seconds}
    </Box>
  </>);
}