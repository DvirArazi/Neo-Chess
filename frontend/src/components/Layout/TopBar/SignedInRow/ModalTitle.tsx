import { Box } from "@mui/material";

export default function ModalTitle(props: { title: string }) {
  const { title } = props;

  return <Box sx={{
    fontWeight: `bold`,
    fontSize: `18px`,
    fontFamily: `robotoslab`,
  }}>{title}</Box>;
}