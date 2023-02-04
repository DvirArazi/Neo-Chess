import { Box } from "@mui/material";
import { ModalEmpty, ModalTitle, VXButtons } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { GameInvitation } from "shared/types/general";

export default function GameInvitationsSection(props: {
  invitationsTd: GameInvitation[]
}) {
  const { invitationsTd: initInvitationsTd } = props;

  const invitationsTd = new Stateful(initInvitationsTd);

  return <Box>
    <ModalTitle title={'Invitations'} />
    {getInvitations()}
  </Box>;

  function getInvitations() {
    if (invitationsTd.value.length === 0) {
      return <ModalEmpty text={'You don\'t have any invitations at the moment'} />
    }

    return <Box>
      {invitationsTd.value.map(data => <Invitation data={data} />)}
    </Box>
  }
}

function Invitation(props: { data: GameInvitation }) {
  const { data } = props;

  return <Box sx={{
    display: `flex`,
    justifyContent: `space-between`,
  }}>
    <Box>
      {`${data.name} - ${getFormatBannerString(data.timeframe, data.isRated)}`}
    </Box>
    <VXButtons onClick={() => { }} />
  </Box>
}