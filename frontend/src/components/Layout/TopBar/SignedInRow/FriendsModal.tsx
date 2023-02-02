import { Box, Divider } from "@mui/material";
import FriendsSection from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal/FriendsSection";
import FriendsSearchSection from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal/FriendsSearchSection";
import FriendRequestsSection from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal/FriendRequestsSection";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import ModalFrame from "frontend/src/components/ModalFrame";
import Stateful from "frontend/src/utils/tools/stateful";
import { FriendsModalData } from "shared/types/general";
import ModalSpacer from "frontend/src/components/Layout/TopBar/SignedInRow/ModalSpacer";

export default function FriendsModal(props: {
  isOpen: Stateful<boolean>,
  data: FriendsModalData,
}) {
  const { isOpen, data } = props;

  console.log('rendering friendsModal', data)

  return <ModalFrame isOpen={isOpen} width={500}>
    <Box sx={{
      padding: `10px`,

      display: `flex`,
      flexDirection: `column`,
    }}>
      <FriendsSearchSection />
      <ModalSpacer />
      <FriendRequestsSection friendRequests={data.friendRequests} />
      <ModalSpacer />
      <FriendsSection friends={data.friends} />
    </Box>
  </ModalFrame>;
}