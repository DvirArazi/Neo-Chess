import { Box, Button } from "@mui/material"
import { GoogleLogin } from "@react-oauth/google";
import { SOCKET, USER_DATA } from "client/src/pages/_app"
import { CookieName as CookieNames, setCookie } from "client/src/utils/cookies";

export function SignInButton() {
  return (
    <GoogleLogin
      text="signin"
      // login_uri=""
      onSuccess={(credentialResponse) => {
        const idToken = credentialResponse.credential!;

        console.log("success on button: " + idToken);

        setCookie(CookieNames.IdToken, idToken);
        SOCKET.emit("authenticate", idToken);
      }}
      onError={() => {
        console.log('Login Failed :(');
      }}
    />
  );
}

export function SignOutButton() {
  if (USER_DATA.value == undefined) {
    throw new Error(
      "SignOutButton cannot be rendered if a user is not signed in."
    );
  }

  return (
    <Box sx={{ display: `flex`, flexDirection: `row` }}>
      <Box>{USER_DATA.value.name!}</Box>
      <Button onClick={() => {
        setCookie(CookieNames.IdToken, undefined);
        USER_DATA.set(undefined);
      }}>Sign Out</Button>
    </Box>
  );
}