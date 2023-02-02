import { Box, Divider } from "@mui/material";
import FriendsSection from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal/FriendsSection";
import SearchSection from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal/SearchSection";
import RequestsSection from "frontend/src/components/Layout/TopBar/SignedInRow/FriendsModal/RequestsSection";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import ModalFrame from "frontend/src/components/ModalFrame";
import Stateful from "frontend/src/utils/tools/stateful";

export default function FriendsModal(props: {
  isOpen: Stateful<boolean>
}) {
  const { isOpen } = props;

  return <ModalFrame isOpen={isOpen} width={500}>
    <Box sx={{
      padding: `10px`,

      display: `flex`,
      flexDirection: `column`,
    }}>
      <SearchSection />
      {getSpacer()}
      <RequestsSection />
      {getSpacer()}
      <FriendsSection />
    </Box>
  </ModalFrame>;

  function getSpacer() {
    return <>
      <Box sx={{ height: `20px` }} />
      <Divider variant="middle" />
      <Box sx={{ height: `20px` }} />
    </>;
  }
}