import { Alert, AlertColor, Box, Portal, Snackbar } from "@mui/material";
import Stateful from "frontend/src/utils/tools/stateful";

export default function AlertSnackbar(props: {
  isOpen: Stateful<boolean>,
  message: string,
  severity: AlertColor,
}) {
  const {isOpen, message, severity} = props;

  return <Box sx={{ position: `relative` }}>
    <Portal>
      <Snackbar
        open={isOpen.value}
        autoHideDuration={3000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
        >
          {message}
        </Alert>
      </Snackbar>
    </Portal>
  </Box>;

  function handleClose() {
    isOpen.set(false);
  }
}