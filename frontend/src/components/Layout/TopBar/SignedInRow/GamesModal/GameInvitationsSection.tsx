import { Box } from "@mui/material";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import { GameInvitation } from "shared/types/general";

export default function GameInvitationsSection(props: {
  invitationsTd: GameInvitation[]
}) {
  return <Box>
    <ModalTitle title={'Invitations'} />
  </Box>;
}