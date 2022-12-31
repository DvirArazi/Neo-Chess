import { Box, Button } from '@mui/material';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function SignInButton() {
  const { data: session } = useSession();

  if (session != null) {
    return (
      <Box sx={{display: `flex`, flexDirection: `row`}}>
        <Box>{session.user.name}</Box>
        <Button onClick={() => {signOut()}}>Sign Out</Button>
      </Box>
    );
  }

  return (
    <Button onClick={() => signIn("google")}>Sign In</Button>
  );
}