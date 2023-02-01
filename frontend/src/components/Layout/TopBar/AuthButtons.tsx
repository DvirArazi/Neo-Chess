import { Box, Button, IconButton } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import Icon from "frontend/src/components/Icon";
import { SOCKET, THEME, USER_DATA } from "frontend/src/pages/_app";

export function AuthButton() {
  return USER_DATA === undefined ?
    <SignInButton /> :
    <SignOutButton />;
}

export function SignInButton() {
  return (
    <GoogleLogin
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
  const data = USER_DATA!;

  return <Button
    onClick={() => SOCKET.emit("signOut")}
    sx={{
      display: `flex`,
      flexDirection: `row`,
      alignItems: `center`,
      border: `solid 2px`,
      borderRadius: `999px`,
      textTransform: `none`,
      color: `gray`,
      background: THEME.topBar,
      ":hover": {
        color: `#595959`
      },
      padding: `5px`,
    }}
  >
    {
      data.picture !== undefined ? 
        <img
          src={USER_DATA!.picture}
          style={{
            borderRadius: `50%`,
            width: `30px`,
            boxShadow: `0px 0px 2px 0.1px rgba(0,0,0,0.5)`,
          }}
        /> : <></>
    }
    <Box sx={{ paddingLeft: `8px`, fontWeight: `550` }}>{data.name!}</Box>
    <Box sx={{ padding: `3px` }} />
    <Icon name="signOut" side={25} filter={THEME.icon} />
  </Button>;
}