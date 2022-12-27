import Head from 'next/head'
import TopBar from '../components/TopBar'
import { Box, MenuItem, NativeSelect, Paper, Select, SelectChangeEvent, Slider } from '@mui/material'
import Icon from '../components/Icon'
import React from 'react'
import Toggle from '../components/Toggle'
import Collapsible from '../components/Collapsible'
import CatagoryButton, { Catagory } from '../components/index/CatagoryButton'
import CompatibleSelect from '../components/CompatibleSelect'
import { BrowserView, MobileView } from 'react-device-detect'
import Stateful from '../Utils/types'
import OnlinePanel from '../components/index/OnlinePanel'

export default function Home() {
  const isOnline = new Stateful(true);
  const isRated = new Stateful(true);
  const isRanged = new Stateful(true);
  const range = new Stateful([-200, 200]);

  const [age, setAge] = React.useState('');
  const handleAgeChange = (event: SelectChangeEvent) => {
    setAge(event.target.value as string);
  }

  return (
    <>
      <Head>
        <title>Neo Chess</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <TopBar></TopBar>
        <h1>Neo-Chess</h1>
        <Toggle isOpen={isOnline}>
          <Icon path="wifi" />
          <Icon path="wifi_off" />
        </Toggle>
        <Box sx={{ textAlign: `center`, padding: `10px` }}>
          <Collapsible isOpen={isOnline.value}>
            <OnlinePanel isRated={isRated} isRanged={isRanged} range={range}/>
          </Collapsible>
        </Box>
        <Box sx={{
          margin: `auto`,
          maxWidth: `500px`,
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
        <BrowserView>Hola</BrowserView>
        <MobileView>Bonjour</MobileView>
      </main>
    </>
  )
}

