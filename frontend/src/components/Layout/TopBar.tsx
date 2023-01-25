import { Box, SxProps, Button, IconButton, Divider } from "@mui/material";
import { USER_DATA, WINDOW_WIDTH } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect } from "react";
import Icon from "../Icon";
import { AuthButton, SignInButton, SignOutButton } from "./TopBar/AuthButtons";

export default function TopBar() {
  const barSx: SxProps = {
    display: `flex`,
    justifyContent: `space-between`,
    alignItems: `center`,
    flexDirection: `row`,
  };

  // const isWide = new Stateful(isWindowWide());

  // useEffect(() => {
  //   window.onresize = () => {
  //     isWide.set(isWindowWide());
  //   }
  // }, []);

  return <>
    <Box sx={{
      ...barSx,
      height: `64px`,
    }}>
      <Box sx={{
        ...barSx,
        paddingLeft: `15px`,
        fontFamily: `robotoslab`,
        fontSize: `28px`,
        whiteSpace: `nowrap`,
      }}>
        <Icon path='logo' side={30} />
        <Box sx={{ padding: `5px` }} />
        {WINDOW_WIDTH > 550 ? 'NEO-CHESS' : <></>}
      </Box>
      <Box sx={{
        ...barSx,
      }}>
        {getIconButton('fight', 28)}
        {getIconButton('history', 28)}
        {getIconButton('friends', 35)}
        <Box sx={{ padding: `0 10px 0 5px` }}><AuthButton /></Box>
      </Box>
    </Box>
    <Divider />
  </>;

  function getIconButton(path: string, side: number) {
    return <Box sx={{
      cursor: `pointer`,
      padding: `0 5px`,
    }}>
      <Icon path={path} side={side} color={'#5F6368'} />
    </Box>
  }
}