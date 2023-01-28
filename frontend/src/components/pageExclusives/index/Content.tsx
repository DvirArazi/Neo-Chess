import { Box, Snackbar, SxProps } from "@mui/material";
import Collapsible from "frontend/src/components/Collapsible";
import Icon from "frontend/src/components/Icon";
import Layout from "frontend/src/components/Layout";
import CatagoryButton from "frontend/src/components/pageExclusives/index/CatagoryButton";
import CustomeFormatPanel from "frontend/src/components/pageExclusives/index/CustomeFormatSelect";
import OnlinePanel from "frontend/src/components/pageExclusives/index/OnlinePanel";
import Toggle from "frontend/src/components/Toggle";
import { SOCKET, THEME, USER_DATA, WINDOW_WIDTH } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Timeframe } from "shared/types/game";
import { Friend } from "shared/types/general";

export default function Content() {
  const router = useRouter();

  const isOnline = new Stateful(false);
  const isRated = new Stateful(true);
  const isRanged = new Stateful(true);
  const range = new Stateful([-200, 200]);
  const chosen = new Stateful("");
  const isSnackbarOpen = new Stateful(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [ratings, setRatings] = useState<number[]>([]);

  const isAuthed = USER_DATA != undefined;

  handleIsAuthedChange();

  return <>
    <Layout>
      <Box sx={{ padding: `10px` }} />
      <Toggle isOn={isOnline} isOnDisabled={!isAuthed}>
        <Icon name="wifi" side={25} filter={isAuthed ?
          THEME.icon : THEME.iconDisabled}
        />
        <Icon name="wifiOff" side={25} filter={THEME.icon}/>
      </Toggle>
      <Box sx={{ textAlign: `center`, paddingTop: `10px` }}>
        <Collapsible isOpen={isOnline.value}>
          <OnlinePanel
            isRated={isRated}
            isRanged={isRanged}
            range={range}
            chosen={chosen}
          />
        </Collapsible>
      </Box>
      {getCatagoryButtons()}
      <CustomeFormatPanel
        onPlay={start}
        ratings={ratings.length !== 0 ? ratings : undefined}
      />
    </Layout>
    <Snackbar
      open={isSnackbarOpen.value}
      autoHideDuration={3000}
      message="Waiting for opponent"
      onClose={() => {
        isSnackbarOpen.set(false);
      }}
    />
  </>;

  function handleIsAuthedChange() {
    useEffect(()=>{
      isOnline.set(isAuthed);

      if (isAuthed) {
        SOCKET.emit("getHomeData", (newFriends, newRatrings)=>{
          setFriends(newFriends);
          setRatings(newRatrings);
        });
      }

    }, [isAuthed]);
  }

  function start(timeframe: Timeframe) {
    if (isOnline.value) {
      isSnackbarOpen.set(true);
      SOCKET.emit("createGameRequest", timeframe, isRated.value, range.value[0], range.value[1]);
    } else {
      router.push(`/game/offline/${timeframeToPath(timeframe)}`);
    }
  }

  function getCatagoryButtons() {
    const isWide = WINDOW_WIDTH > 600;

    const sx: SxProps = {
      flex: `1`,

      display: `flex`,
      flexDirection: `row`,
      justifyContent: `center`,
    };

    const buttons = [
      <CatagoryButton catagory={{ title: "Untimed" }} rating={getRating(0)} />,
      <CatagoryButton catagory={{ title: "Bullet", time: 60, increment: 2 }} rating={getRating(1)} />,
      <CatagoryButton catagory={{ title: "Blitz", time: 5*60, increment: 3 }} rating={getRating(2)} />,
      <CatagoryButton catagory={{ title: "Rapid", time: 10*60, increment: 5 }} rating={getRating(3)} />,
      <CatagoryButton catagory={{ title: "Classical", time: 30*60, increment: 20 }} rating={getRating(4)} />,
    ];

    return <Box sx={{
      display: `flex`,
      flexDirection: `column`,
      justifyContent: `center`,
    }}>{
      isWide ? 
        <Box sx={sx}>{buttons}</Box> :
        <> 
          <Box sx={sx}>{buttons.slice(0, 3)}</Box>
          <Box sx={sx}>{buttons.slice(3, 5)}</Box>
        </>  
    }</Box>

    function getRating(index: number) {
      if (ratings.length === 0) return undefined;

      return ratings[index];
    }
  }
}

function timeframeToPath(timeframe: Timeframe) {
  return `${timeframe.overallSec}-${timeframe.incSec}`;
}