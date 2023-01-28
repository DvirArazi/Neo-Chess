import { Box, SxProps, Button, IconButton, Divider } from "@mui/material";
import { THEME, USER_DATA, WINDOW_WIDTH } from "frontend/src/pages/_app";
import { IconName } from "frontend/src/utils/types/iconName";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect } from "react";
import Icon from "../Icon";
import { AuthButton, SignInButton, SignOutButton } from "./TopBar/AuthButtons";
import { useRouter } from "next/router";

export default function TopBar() {
  const router = useRouter();

  const barSx: SxProps = {
    display: `flex`,
    justifyContent: `space-between`,
    alignItems: `center`,
    flexDirection: `row`,
  };

  return <>
    <Box sx={{
      ...barSx,
      height: `64px`,
      background: THEME.topBar,
    }}>
      <Box
        onClick={()=>{
          router.push('/');
        }}
        sx={{
          ...barSx,
          paddingLeft: `15px`,
          fontFamily: `robotoslab`,
          fontSize: `28px`,
          whiteSpace: `nowrap`,
          cursor: `pointer`,
        }}
      >
        <Icon name="logo" side={30} />
        <Box sx={{ padding: `5px` }} />
        {WINDOW_WIDTH > 550 ? 'NEO-CHESS' : <></>}
      </Box>
      <Box sx={{
        ...barSx,
      }}>
        {getButton('fight', 28)}
        {getButton('history', 25)}
        {getButton('friends', 33)}
        <Box sx={{ padding: `0 10px 0 5px` }}><AuthButton /></Box>
      </Box>
    </Box>
    <Divider />
  </>;

  function getIconButton(name: IconName, side: number) {
    return <Box sx={{
      cursor: `pointer`,
      padding: `0 5px`,
    }}>
      <Icon name={name} side={side} filter={'#5F6368'} />
    </Box>
  }

  function getButton(name: IconName, side: number) {
    const padding = 25-side;

    return <IconButton
      onClick={()=>{}}
    >
      <Box sx={{padding: `${padding/2}px`}}>
        <Icon
          name={name}
          side={side}
          filter={THEME.icon}
        />
      </Box>
    </IconButton>
  }
}