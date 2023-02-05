import { Box } from "@mui/material";
import { ModalEmpty, ModalTitle, VXButtons } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import { SOCKET } from "frontend/src/pages/_app";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect } from "react";
import { Friend, GameInvitation } from "shared/types/general";

export default function GameInvitationsSection(props: {
  invitations: GameInvitation[]
}) {
  const { invitations: initInvitations } = props;

  const invitations = new Stateful(initInvitations);

  initInvitationsValue();
  handleInvitationsUpdated();

  return <Box>
    <ModalTitle title={'Invitations'} />
    {getInvitations()}
  </Box>;

  function initInvitationsValue() {
    useEffect(() => {
      invitations.set(initInvitations);
    }, [initInvitations]);
  }

  function handleInvitationsUpdated() {
    SOCKET.off("gameInvitationsUpdated");
    SOCKET.on("gameInvitationsUpdated", (newInvitations) => {
      invitations.set(newInvitations);
    });
  }

  function getInvitations() {
    if (invitations.value.length === 0) {
      return <ModalEmpty text={'You don\'t have any invitations at the moment'} />
    }

    return <Box>
      {invitations.value.map((data, i) => <Invitation key={i} data={data} />)}
    </Box>
  }
}

function Invitation(props: { data: GameInvitation }) {
  const { data } = props;

  return <Box sx={{
    display: `flex`,
    justifyContent: `space-between`,
    alignItems: `center`,
    paddingTop: `10px`,
  }}>
    <Box sx={{
      display: `flex`,
      alignItems: `baseline`,
    }}>
      <Box sx={{
        fontWeight: `bold`,
        fontSize: `18px`,
        padding: `0 8px 0 10px`,
      }}>{data.name}</Box>
      {`• ${getFormatBannerString(data.timeframe, data.isRated)}`}
    </Box>
    <VXButtons onClick={() => { }} />
  </Box>
}