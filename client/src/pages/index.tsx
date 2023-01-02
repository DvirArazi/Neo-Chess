import Head from 'next/head'
import TopBar from '../components/Layout/TopBar'
import { Box, Snackbar, SnackbarCloseReason } from '@mui/material'
import Icon from '../components/Icon'
import React from 'react'
import Toggle from '../components/Toggle'
import Collapsible from '../components/Collapsible'
import Stateful from '../utils/stateful'
import OnlinePanel from '../components/pageExclusives/index/OnlinePanel'
import CatagoryButton from '../components/pageExclusives/index/CatagoryButton'
import CustomeFormatPanel from '../components/pageExclusives/index/CustomeFormatSelect'
import Layout from '../components/Layout'
import { Clock } from 'shared/types'
import { useRouter } from 'next/router'
import { SOCKET } from './_app'

export default function Home() {
  const router = useRouter();

  const isOnline = new Stateful(false);
  const isRated = new Stateful(true);
  const isRanged = new Stateful(true);
  const range = new Stateful([-200, 200]);
  const chosen = new Stateful("");
  const isSnackbarOpen = new Stateful(false);

  const start = (isOnline: boolean, clock: Clock) => {
    if (isOnline) {
      isSnackbarOpen.set(true);

      SOCKET.emit("openGameRequest", clock, (gameId: string) => {
        console.log("woooooow");
      });

      // router.push('/game/abc');
    } else {
      // router.push('/game/offline');
    }
  };

  return (
    <>
      <Layout>
        <h1>Neo-Chess</h1>
        <Toggle isOpen={isOnline} isLeftDisabled={false}>
          <Icon path="wifi" isGrayed={false}/>
          <Icon path="wifi_off" />
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
        <CustomeFormatPanel onPlay={(clock) => start(isOnline.value, clock)} />
      </Layout>
      <Box sx={{padding: `30px`}}/>

      <Snackbar
        open={isSnackbarOpen.value}
        autoHideDuration={3000}
        message="Waiting for opponent"
        onClose={(_: any, reason: SnackbarCloseReason)=>{
          isSnackbarOpen.set(false);
        }}
      />
    </>
  )
}