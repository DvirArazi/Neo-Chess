import { Box, Button } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import { SOCKET, USER_DATA } from "frontend/src/pages/_app";
export function AuthButton() {
    return USER_DATA === undefined ?
        <SignInButton /> :
        <SignOutButton />;
}
export function SignInButton() {
    return (<GoogleLogin 
    // text="signup"
    // shape="circle"
    // logo_alignment="center"
    // theme="filled_blue"
    // type="icon"
    // width="20px"
    onSuccess={function (credentialResponse) {
            var idToken = credentialResponse.credential;
            SOCKET.emit("signIn", idToken);
        }} onError={function () {
            console.log('Login Failed :(');
        }}/>);
}
export function SignOutButton() {
    return (<Box sx={{ display: "flex", flexDirection: "row" }}>
      <Box>{USER_DATA.name}</Box>
      <Button onClick={function () {
            SOCKET.emit("signOut");
        }}>Sign Out</Button>
    </Box>);
}
