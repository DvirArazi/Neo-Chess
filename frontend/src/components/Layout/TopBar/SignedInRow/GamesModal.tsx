import { Box, Button } from "@mui/material";
import GameInvitationsSection from "frontend/src/components/Layout/TopBar/SignedInRow/GamesModal/GameInvitationsSection";
import OngoingGamesSection from "frontend/src/components/Layout/TopBar/SignedInRow/GamesModal/OngoingGameSection";
import YourRequestSection from "frontend/src/components/Layout/TopBar/SignedInRow/GamesModal/YourRequestSection";
import { ModalSpacer } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import ModalFrame from "frontend/src/components/ModalFrame";
import Stateful from "frontend/src/utils/tools/stateful";
import { GamesModalData, GameTd, GameInvitation } from "shared/types/general";

export default function GamesModal(props: {
  isOpen: Stateful<boolean>
  data: GamesModalData,
}) {
  const { isOpen, data } = props;

  return <ModalFrame isOpen={isOpen} width={500}>
    <Box sx={{
      padding: `10px`,

      display: `flex`,
      flexDirection: `column`,
      justifyContent: `center`,
    }}>
      <OngoingGamesSection ongoingGamesTd={data.ongoingGamesTd} />
      <ModalSpacer />
      <GameInvitationsSection invitations={data.invitations}/>
      <YourRequestSection request={data.requestTd} />
    </Box>
  </ModalFrame>;
}