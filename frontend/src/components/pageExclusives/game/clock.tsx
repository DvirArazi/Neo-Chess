import { Box } from "@mui/material";

export default function Clock(props: { millis: number }) {
  const {millis} = props;

  const minutes = Math.floor(millis / (60 * 1000));
  const seconds = Math.floor(millis / 1000) % 60;

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