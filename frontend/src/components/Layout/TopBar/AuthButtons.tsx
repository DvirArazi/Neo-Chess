import { Box, Button } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import { SOCKET, USER_DATA } from "frontend/src/pages/_app";

export function AuthButton() {
  return USER_DATA === undefined ?
  <SignInButton /> :
  <SignOutButton />;
}

export function SignInButton() {
  return (
    <GoogleLogin
      // text="signup"
      // shape="circle"
      // logo_alignment="center"
      // theme="filled_blue"
      // type="icon"
      // width="20px"
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
      <Box>{USER_DATA!.name!}</Box>
      <Button onClick={() => {

        SOCKET.emit("signOut");

      }}>Sign Out</Button>
    </Box>
  );
}