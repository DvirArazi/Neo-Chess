import { Box } from "@mui/material";

export default function Empty(props: { message: string }) {
  const { message } = props;

  return <Box sx={{
    position: `absolute`,
    top: `50%`,
    left: `50%`,
    transform: `translate(-50%, -50%)`,
  }}>
    {message}
  </Box>
}