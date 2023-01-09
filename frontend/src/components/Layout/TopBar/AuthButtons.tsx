import { Box, Button } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import { SOCKET, USER_DATA } from "frontend/src/pages/_app";
import { AAD_COOKIE } from "frontend/src/utils/cookies";

export function SignInButton() {
  return (
    <GoogleLogin
      text="signin"
      onSuccess={(credentialResponse) => {
        const idToken = credentialResponse.credential!;

        SOCKET.emit("signIn", idToken);
      }}
      onError={() => {
        console.log('Login Failed :(');
      }}
    />
  );
}

export function SignOutButton() {
  return (
    <Box sx={{ display: `flex`, flexDirection: `row` }}>
      <Box>{USER_DATA.value!.name!}</Box>
      <Button onClick={() => {

        SOCKET.emit("signOut", AAD_COOKIE.get()!);

      }}>Sign Out</Button>
    </Box>
  );
}