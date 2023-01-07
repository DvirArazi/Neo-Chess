import { Box, Snackbar } from '@mui/material'
import Icon from '../components/Icon'
import React, { useEffect } from 'react'
import Toggle from '../components/Toggle'
import Collapsible from '../components/Collapsible'
import Stateful from '../utils/stateful'
import OnlinePanel from '../components/pageExclusives/index/OnlinePanel'
import CatagoryButton from '../components/pageExclusives/index/CatagoryButton'
import CustomeFormatPanel from '../components/pageExclusives/index/CustomeFormatSelect'
import Layout from '../components/Layout'
import { GameSettings, Timeframe } from 'shared/types'
import { useRouter } from 'next/router'
import { SOCKET, USER_DATA } from './_app'

export default function Home() {
  const router = useRouter();

  const isOnline = new Stateful(false);
  const isRated = new Stateful(true);
  const isRanged = new Stateful(true);
  const range = new Stateful([-200, 200]);
  const chosen = new Stateful("");
  const isSnackbarOpen = new Stateful(false);

  const isAuthed = USER_DATA.get != undefined;

  const start = (isOnline: boolean, gameRequest: GameSettings) => {
    if (isOnline) {
      isSnackbarOpen.set(true);

      SOCKET.emit("openGameRequest", gameRequest);

      router.push('/game/abc');
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
          <Collapsible isOpen={isOnline.get}>
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
        <CustomeFormatPanel onPlay={(timeframe) => start(isOnline.get, { timeframe: timeframe, isRated: isRated.get })} />
      </Layout>
      <Box sx={{ padding: `30px` }} />

      <Snackbar
        open={isSnackbarOpen.get}
        autoHideDuration={3000}
        message="Waiting for opponent"
        onClose={() => {
          isSnackbarOpen.set(false);
        }}
      />
    </>
  )
}