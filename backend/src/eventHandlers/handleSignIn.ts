import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { User } from "../utils/types";
import { v4 as uuidv4 } from 'uuid';
import { emitToUser } from "../utils/tools/general";

export function handleSignIn(p: HandlerParams) {
  p.socket.on("signIn", async (idToken) => {
    const ticket = await p.oAuth2Client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const data = ticket.getPayload();
    if (data === undefined) {
      Terminal.warning('"payload" is undefined. Invalid idToken.');
      return;
    }

    const googleId = data.sub;
    const newKey = uuidv4();
    const userResult = await p.usersCollection.findOneAndUpdate(
      { googleId: googleId },
      {
        $push: { socketsIds: { key: newKey, values: [p.socket.id] } },
        $setOnInsert: <Omit<User, "socketsIds">>{
          googleId: googleId,
          data: data,
          name: data.name,
          gameRequestId: undefined,
          ongoingGamesIds: [],
          ratings: [1200, 1000, 1000, 1200, 1200],
          friends: [],
          friendRequests: [],
        }
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );
    if (userResult.value === null) {
      Terminal.error("Could not find or create user");
      return;
    }
    const user = userResult.value;

    p.userId = userResult.value._id;
    emitToUser(p.webSocketServer, userResult.value, "signedIn",
      { id: p.userId, key: newKey },
      { name: user.name, picture: user.data.picture }
    );
  });
}