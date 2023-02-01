import { Box } from "@mui/material";
import RequestArea from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal/RequestArea";
import WaitingRequests from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal/WaitingRequests";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import ModalFrame from "frontend/src/components/ModalFrame";
import Stateful from "frontend/src/utils/tools/stateful";

export default function FriendsModal(props: {
  isOpen: Stateful<boolean>
}) {
  const { isOpen } = props;

  return <ModalFrame isOpen={isOpen}>
    <Box sx={{
      padding: `10px`,

      display: `flex`,
      flexDirection: `column`,
    }}>
      <ModalTitle title={'Send a friend request'}/>
      <RequestArea/>
      <WaitingRequests/>
    </Box>
  </ModalFrame>;
}