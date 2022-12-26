import Head from 'next/head'
import TopBar from '../components/TopBar'
import { Box, Paper, Slider } from '@mui/material'
import Icon from '../components/Icon'
import React from 'react'
import Toggle from '../components/Toggle'
import Collapsible from '../components/Collapsible'
import CatagoryButton, {Catagory} from '../components/index/CatagoryButton'
import OctagonPicker from '../components/OctagonPicker'

export default function Home() {
  const [isOnline, setIsOnline] = React.useState<boolean|null>(true);
  const [isRated, setIsRated] = React.useState<boolean>(true);
  const [range, setRange] = React.useState<number[]>([-200, 200]);

  const handleRangeChange = (_: any, newRange: number[])=>{
    if (newRange[0] != newRange[1]) {
      setRange(newRange);
    }
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
        <OctagonPicker />
        <h1>Neo-Chess</h1>
        <Toggle isOpen={isOnline} setIsOpen={setIsOnline}>
          <Icon path="wifi" />
          <Icon path="wifi_off" />
        </Toggle>
        <Box sx={{textAlign:`center`, padding: `10px`}}>
          <Collapsible isOpen={isOnline}>
            <Box sx={{
              padding: `10px`,
            }}>
              <Paper elevation={3} sx={{
                padding: `20px`
              }}>
                <Toggle isOpen={isRated} setIsOpen={setIsRated}>
                  <Box sx={{fontSize: `12px`, width: `50px`}}>Rated</Box>
                  <Box sx={{fontSize: `12px`, width: `50px`}}>Casual</Box>
                </Toggle>
                <Box sx={{marginBottom: `20px`}}></Box>
                <Box>Rating Range</Box>
                <Paper variant="outlined" sx={{
                  margin: `5px`,
                  padding: `20px 20px 10px 20px`,
                }}>
                  <Box sx={{}}>
                    {rangeToString(range[0])} to {rangeToString(range[1])}
                  </Box>
                  <Slider
                    value={range}
                    onChange={handleRangeChange}
                    min={-500}
                    max={500}
                    step={50}
                    marks={[
                      {
                        value: -490,
                        label: `-500`,
                      },
                      {
                        value: 490,
                        label: `500`,
                      }
                    ]}
                  />
                </Paper>
              </Paper>
            </Box>
          </Collapsible>
        </Box>
        <Box sx={{
          margin: `auto`,
          maxWidth: `500px`,
          display: `flex`,
          flexDirection: `row`,
          justifyContent: `space-around`,
        }}>
          <CatagoryButton catagory={{title: "Untimed"}} rating={1234}/>
          <CatagoryButton catagory={{title: "Bullet", time: 60, increment: 2}} rating={1234}/>
          <CatagoryButton catagory={{title: "Blitz", time: 60, increment: 2}} rating={1234}/>
          <CatagoryButton catagory={{title: "Rapid", time: 60, increment: 2}} rating={1234}/>
          <CatagoryButton catagory={{title: "Classical", time: 60, increment: 2}} rating={1234}/>
        </Box>
      </main>
    </>
  )
}

const rangeToString = (range: number)=>{
  return range > 0 ? `+${range}` : range;
}