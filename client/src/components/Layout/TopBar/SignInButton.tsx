import { Box, Button } from '@mui/material';
import { GoogleLogin, hasGrantedAllScopesGoogle } from '@react-oauth/google';
import { SOCKET } from 'client/src/pages/_app';

export default function SignInButton() {

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        console.log(credentialResponse);
        SOCKET.emit("authenticate", credentialResponse.credential!);
      }}
      onError={() => {
        console.log('Login Failed :(');
      }}
    />
  );
}