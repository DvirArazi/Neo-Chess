import { Box } from "@mui/material";

export default function Loading() {
  return <Box sx={{
    position: `absolute`,
    top: `50%`,
    left: `50%`,
    transform: `translate(-50%, -50%)`,
  }}>
    {'Loading...'}
  </Box>
}