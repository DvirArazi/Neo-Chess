import { Box, SxProps, IconButton, Divider, } from "@mui/material";
import { SOCKET, THEME, USER_DATA, WINDOW_WIDTH } from "frontend/src/pages/_app";
import Icon from "../Icon";
import { AuthButton, SignInButton, SignOutButton } from "./TopBar/AuthButtons";
import { useRouter } from "next/router";
import SignedInRow from "frontend/src/components/Layout/TopBar/SignedInRow";

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
        onClick={() => {
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
        {USER_DATA === undefined ? <></> : <SignedInRow />}
      <Box sx={{ padding: `0 10px 0 5px` }}><AuthButton /></Box>
      </Box>
    </Box>
    <Divider />
  </>;
}