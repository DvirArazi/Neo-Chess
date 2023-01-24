import { Box, Snackbar } from "@mui/material";
import Collapsible from "frontend/src/components/Collapsible";
import Icon from "frontend/src/components/Icon";
import Layout from "frontend/src/components/Layout";
import CatagoryButton from "frontend/src/components/pageExclusives/index/CatagoryButton";
import CustomeFormatPanel from "frontend/src/components/pageExclusives/index/CustomeFormatSelect";
import OnlinePanel from "frontend/src/components/pageExclusives/index/OnlinePanel";
import Toggle from "frontend/src/components/Toggle";
import { SOCKET, USER_DATA } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRouter } from "next/router";
import { Timeframe } from "shared/types/game";

export default function Content() {
  const router = useRouter();

  const isOnline = new Stateful(false);
  const isRated = new Stateful(true);
  const isRanged = new Stateful(true);
  const range = new Stateful([-200, 200]);
  const chosen = new Stateful("");
  const isSnackbarOpen = new Stateful(false);

  const isAuthed = USER_DATA != undefined;

  const start = (timeframe: Timeframe) => {
    if (isOnline) {
      isSnackbarOpen.set(true);
      SOCKET.emit("createGameRequest", timeframe, isRated.value, range.value[0], range.value[1]);
    } else {
      router.push('/game/offline');
    }
  };

  return (
    <>
      <Layout>
        <h1>Neo-Chess</h1>
        <Toggle isOn={isOnline} isOnDisabled={!isAuthed}>
          <Icon path="wifi" side={25} color={isAuthed ? "#000000" : "#808080"} />
          <Icon path="wifi_off" side={25} />
        </Toggle>
        <Box sx={{ textAlign: `center`, padding: `10px` }}>
          <Collapsible isOpen={isOnline.value}>
            <OnlinePanel
              isRated={isRated}
              isRanged={isRanged}
              range={range}
              chosen={chosen}
            />
          </Collapsible>
        </Box>
        <Box sx={{
          display: `flex`,
          flexDirection: `row`,
          justifyContent: `space-around`,
        }}>
          <CatagoryButton catagory={{ title: "Untimed" }} rating={1234} />
          <CatagoryButton catagory={{ title: "Bullet", time: 60, increment: 2 }} rating={1234} />
          <CatagoryButton catagory={{ title: "Blitz", time: 60, increment: 2 }} rating={1234} />
          <CatagoryButton catagory={{ title: "Rapid", time: 60, increment: 2 }} rating={1234} />
          <CatagoryButton catagory={{ title: "Classical", time: 60, increment: 2 }} rating={1234} />
        </Box>
        <CustomeFormatPanel onPlay={start} />
      </Layout>
      <Box sx={{ padding: `30px` }} />

      <Snackbar
        open={isSnackbarOpen.value}
        autoHideDuration={3000}
        message="Waiting for opponent"
        onClose={() => {
          isSnackbarOpen.set(false);
        }}
      />
    </>
  )
}