import { Box, SxProps, Button } from "@mui/material";
import { SOCKET } from "client/src/pages/_app";
import Stateful from "client/src/utils/stateful";
import { TokenPayload } from "google-auth-library";
import Icon from "../Icon";
import SignInButton from "./TopBar/SignInButton";

export default function TopBar() {
  const barSx: SxProps = {
    display: `flex`,
    justifyContent: `space-between`,
  };
  const rowSx: SxProps = {
    display: `flex`,
    flexDirection: `row`,
  };
  const itemSx: SxProps = {
    padding: `5px`,
  };

  const userData = new Stateful<TokenPayload | undefined>(undefined);

  SOCKET.on("authenticated", (data) => {
    console.log("bla")
    userData.set(data);
  });

  function GoogleLogout() {
    throw new Error("Function not implemented.");
  }

  return (
    <Box sx={barSx}>
      <Box sx={rowSx}>
        <Box sx={itemSx}>
          {
            userData.value == undefined ? 
              <SignInButton /> :
              <Box sx={{display: `flex`, flexDirection: `row`}}>
                <Box>{userData.value.name!}</Box>
                <Button onClick={()=>{userData.set(undefined)}}>Sign Out</Button>
              </Box>
          }
        </Box>
      </Box>
      <Box sx={rowSx}>
        <Box sx={{
          ...itemSx,
          ...{
            width: `25px`,
            height: `25px`,
          }
        }}>
          <Icon path="fight" />
        </Box>
        <Box sx={{
          ...itemSx,
          ...{
            width: `23px`,
            height: `23px`,
          }
        }}>
          <Icon path="history" />
        </Box>
        <Box sx={{
          ...itemSx,
          ...{
            width: `30px`,
            height: `30px`,
          }
        }}>
          <Icon path="friends" />
        </Box>
      </Box>
    </Box>
  );
}