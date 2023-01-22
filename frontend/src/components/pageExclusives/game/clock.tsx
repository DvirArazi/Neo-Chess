import { Box } from "@mui/material";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";

export default function Clock(props: {
  timeLeftMil: number,
  tick: boolean,
}) {
  const { timeLeftMil, tick } = props;

  function InnerClock(props: { initDateTime: number }) {
    const { initDateTime } = props;

    const dateTime = new Stateful(new Date().getTime());

    useEffect(() => {
      if (tick) {
        const interval = setInterval(() => {
          dateTime.set(new Date().getTime())
        }, 100);
        return () => clearInterval(interval);
      }
    }, [tick]);


    const crntMillis = timeLeftMil - (dateTime.value - initDateTime);

    const minutes = Math.floor(crntMillis / (60 * 1000));
    const seconds = Math.floor(crntMillis / 1000) % 60;

    return (<>
      <Box sx={{
        padding: `5px 10px`,
        background: `lightgray`,
        fontSize: `24px`,
      }}>
        {minutes}:{seconds}
      </Box>
    </>);
  }

  return <InnerClock initDateTime={new Date().getTime()} />
}