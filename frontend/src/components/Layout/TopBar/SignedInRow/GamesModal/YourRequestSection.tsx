import { Alert, Box, IconButton, Portal, Snackbar, Tooltip } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { ModalSpacer, ModalTitle } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import { SOCKET } from "frontend/src/pages/_app";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { GameRequestTd } from "shared/types/general";

export default function YourRequestSection(props: {
  request: GameRequestTd | null
}) {
  const { request: initRequest } = props;

  const request = new Stateful(initRequest);
  const isSnackbarOpen = new Stateful(false);

  handleGameRequestUpdated();

  return <Box>
    {getRequest()}
    {getToolbar()}
  </Box>

  function handleGameRequestUpdated() {
    SOCKET.off("gameRequestUpdated");
    SOCKET.on("gameRequestUpdated", (gameRequestTd) => {
      console.log('updated to', gameRequestTd);
      request.set(gameRequestTd);
    });
  }

  function getRequest() {
    if (request.value === null) return <Box></Box>;

    const r = request.value;

    return <>
      <ModalSpacer />
      <ModalTitle title={'Your request'} />
      <Box sx={{
        display: `flex`,
        justifyContent: `center`,
        alignItems: `center`,
      }}>
        <Box sx={{ width: `40px` }} />
        <Box>
          {
            getFormatBannerString(r.timeframe, r.isRated)
            + ` • (${r.isByRating ? `${r.ratingAbsMin} to ${r.ratingAbsMax}` : `vs ${r.opponentName}`})`
          }
        </Box>
        <Box sx={{ width: `15px` }} />
        <Tooltip
          title={'cancel'}
          placement={"top"}
          arrow
        >
          <IconButton onClick={()=>SOCKET.emit("deleteGameRequest", ()=>{
            request.set(null);
            isSnackbarOpen.set(true);
          })}>
            <Icon name="cancel" side={25} />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  }

  function getToolbar() {
    return <Box sx={{ position: `relative` }}>
      <Portal>
        <Snackbar
          open={isSnackbarOpen.value}
          autoHideDuration={3000}
          onClose={handleClose}
        >
          <Alert
            onClose={handleClose}
            severity={"info"}
          >
            {"Your game request was canceled"}
          </Alert>
        </Snackbar>
      </Portal>
    </Box>;

    function handleClose() {
      isSnackbarOpen.set(false);
    }
  }
}