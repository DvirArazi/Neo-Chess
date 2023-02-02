import { Box, Button } from "@mui/material";
import OngoingGamesThumbnail from "frontend/src/components/Layout/TopBar/SignedInRow/GamesModal/OngoingGameThumbnail";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import ModalFrame from "frontend/src/components/ModalFrame";
import BoardBackground from "frontend/src/components/pageExclusives/game/BoardBackground";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { Player } from "shared/types/game";
import { GamesModalData, GameTd, InvitationTd } from "shared/types/general";

export default function GamesModal(props: {
  isOpen: Stateful<boolean>
  data: GamesModalData,
}) {
  const { isOpen, data } = props;

  return <ModalFrame isOpen={isOpen} width={500}>
    <Box sx={{
      display: `flex`,
      flexDirection: `column`,
      justifyContent: `center`,
    }}>
      {getOngoingGames()}
    </Box>
  </ModalFrame>;

  function getOngoingGames() {
    if (data.ongoingGamesTd.length === 0) return <></>;

    return <OngoingGamesThumbnail ongoingGamesTd={data.ongoingGamesTd} />
  }

  function getInvitations() {
    if (data.invitationsTd.length === 0) return <></>;
  }
}

function InvitationThumbnail(props: { data: InvitationTd }) {
  const { id, name, isRated, timeframe } = props.data;


}