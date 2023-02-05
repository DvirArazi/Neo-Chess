import { Accordion, AccordionDetails, AccordionSummary, Box, Snackbar, SxProps } from "@mui/material";
import AlertSnackbar from "frontend/src/components/AlertSnackbar";
import Collapsible from "frontend/src/components/Collapsible";
import Icon from "frontend/src/components/Icon";
import Layout from "frontend/src/components/Layout";
import CatagoryButton from "frontend/src/components/pageExclusives/index/Content/CatagoryButton";
import CustomeFormatPanel from "frontend/src/components/pageExclusives/index/Content/CustomeFormatSelect";
import OnlinePanel from "frontend/src/components/pageExclusives/index/Content/OnlinePanel";
import Toggle from "frontend/src/components/Toggle";
import { SOCKET, THEME, USER_DATA, WINDOW_WIDTH } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Timeframe } from "shared/types/game";
import { Friend, GameInvitation } from "shared/types/general";

export default function Content() {
  const router = useRouter();

  const isOnline = new Stateful(false);
  const isRated = new Stateful(true);
  const isRanged = new Stateful(true);
  const range = new Stateful([-200, 200]);
  const chosenFriend = new Stateful<Friend | null>(null);
  const isRequestSnackbarOpen = new Stateful(false);
  const isInvitationSnackbarOpen = new Stateful(false);
  const invitationSnackbarData = useRef({ friendName: '', success: false })
  const [ratings, setRatings] = useState<number[]>([]);

  const isAuthed = USER_DATA != undefined;

  handleIsAuthedChange();

  return <>
    <Layout>
      <Box sx={{ padding: `10px` }} />
      <Toggle isOn={isOnline} isOnDisabled={!isAuthed}>
        <Icon name="wifi" side={25} filter={
          isAuthed ?
            (isOnline.value ? THEME.icon : THEME.iconNotSelected) :
            THEME.iconDisabled
        }
        />
        <Icon name="wifiOff" side={25} filter={
          isOnline.value ? THEME.iconNotSelected : THEME.icon
        } />
      </Toggle>
      <OnlinePanel
        isOnline={isOnline.value}
        isRated={isRated}
        isRanged={isRanged}
        range={range}
        chosenFriend={chosenFriend}
      />
      {getCatagoryButtons()}
      <CustomeFormatPanel
        onPlay={start}
        ratings={ratings.length !== 0 ? ratings : undefined}
      />
      {getRequestSnackbar()}
      {getInvitationSnackbar()}
    </Layout>
    
  </>;

  function handleIsAuthedChange() {
    useEffect(() => {
      isOnline.set(isAuthed);

      if (isAuthed) {
        SOCKET.emit("getHomeData", (newRatrings) => {
          setRatings(newRatrings);
        });
      }

    }, [isAuthed]);
  }

  function start(timeframe: Timeframe) {
    if (isOnline.value) {
      if (isRanged.value) {
        SOCKET.emit("createGameRequest", timeframe, isRated.value, range.value[0], range.value[1]);
        isRequestSnackbarOpen.set(true);
      } else {
        if (chosenFriend.value === null) return;
        const friend = chosenFriend.value;
        SOCKET.emit("sendGameInvitation", timeframe, isRated.value, friend.id, (sent) => {
          invitationSnackbarData.current = { friendName: friend.name, success: sent };
          isInvitationSnackbarOpen.set(true);
        });
      }
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
      <CatagoryButton key={0}
        catagory={{ title: "Untimed" }}
        rating={getRating(0)}
        onClick={() => start("untimed")}
      />,
      <CatagoryButton key={1}
        catagory={{ title: "Bullet", time: 60, increment: 2 }}
        rating={getRating(1)}
        onClick={() => start({ overallSec: 60, incSec: 2 })}
      />,
      <CatagoryButton key={2}
        catagory={{ title: "Blitz", time: 5 * 60, increment: 3 }}
        rating={getRating(2)}
        onClick={() => start({ overallSec: 5 * 60, incSec: 3 })}
      />,
      <CatagoryButton key={3}
        catagory={{ title: "Rapid", time: 10 * 60, increment: 5 }}
        rating={getRating(3)}
        onClick={() => start({ overallSec: 10 * 60, incSec: 5 })}
      />,
      <CatagoryButton key={4}
        catagory={{ title: "Classical", time: 30 * 60, increment: 20 }}
        rating={getRating(4)}
        onClick={() => start({ overallSec: 30 * 60, incSec: 20 })}
      />,
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

  function getRequestSnackbar() {
    return <AlertSnackbar
      isOpen={isRequestSnackbarOpen}
      message="Game request sent"
      severity="info"
    />;
  }

  function getInvitationSnackbar() {
    const { friendName, success } = invitationSnackbarData.current;

    return <AlertSnackbar
      isOpen={isInvitationSnackbarOpen}
      message={
        `Invitation to ${friendName} ${success ?
          'was sent successfully' : 'could not be sent'}`
      }
      severity={success ? "success" : "error"}
    />;
  }
}

function timeframeToPath(timeframe: Timeframe) {
  if (timeframe === "untimed") return `untimed`;

  return `${timeframe.overallSec}-${timeframe.incSec}`;
}