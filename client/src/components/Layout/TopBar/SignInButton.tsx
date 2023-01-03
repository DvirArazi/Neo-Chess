import { Box, Button } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { COOKIE, SOCKET, USER_DATA } from 'client/src/pages/_app';

export function SignInButton() {

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        const tid = credentialResponse.credential!;

        COOKIE.tid = tid;
        SOCKET.emit("authenticate", tid);
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
    <Box sx={{display: `flex`, flexDirection: `row`}}>
      <Box>{USER_DATA.value.name!}</Box>
      <Button onClick={()=>{
        COOKIE.tid = undefined;
        USER_DATA.set(undefined);
      }}>Sign Out</Button>
    </Box>
  );
}