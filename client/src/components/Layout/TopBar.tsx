import { Box, SxProps, Button } from "@mui/material";
import { COOKIE, SOCKET, USER_DATA } from "client/src/pages/_app";
import Stateful from "client/src/utils/stateful";
import { TokenPayload } from "google-auth-library";
import Icon from "../Icon";
import { SignInButton, SignOutButton } from "./TopBar/AuthenticationButtons";

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

  function GoogleLogout() {
    throw new Error("Function not implemented.");
  }

  return (
    <Box sx={barSx}>
      <Box sx={rowSx}>
        <Box sx={itemSx}>
          {
            USER_DATA.value == undefined ? 
              <SignInButton /> :
              <SignOutButton />
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