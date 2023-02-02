import { Box, IconButton, Tooltip } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import ModalSpacer from "frontend/src/components/Layout/TopBar/SignedInRow/ModalSpacer";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import { SOCKET } from "frontend/src/pages/_app";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { GameRequestTd } from "shared/types/general";

export default function YourRequestSection(props: {
  request: GameRequestTd | null
}) {
  const { request: initRequest } = props;

  const shitFuck = new Stateful(false);
  const puffRequest = new Stateful(initRequest);

  handleGameRequestUpdated();

  return <Box>
    {shitFuck.value}
    {getRequest()}
  </Box>

  function handleGameRequestUpdated() {
    SOCKET.off("gameRequestUpdated");
    SOCKET.on("gameRequestUpdated", (gameRequestTd) => {
      console.log('updated to', gameRequestTd);
      puffRequest.set(gameRequestTd);
      shitFuck.set(v => !v);
    });
  }

  function getRequest() {
    if (puffRequest.value === null) return <Box></Box>;

    const r = puffRequest.value;

    return <>
      <ModalSpacer />
      <ModalTitle title={'Your request'} />
      <Box sx={{
        display: `flex`,
        // flexDirection: `row`,
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
          <IconButton>
            <Icon name="cancel" side={25} />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  }
}