import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { User } from "../utils/types";
import { v4 as uuidv4 } from 'uuid';
import { emitToUser } from "backend/src/utils/tools/general";

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
    if (data.name === undefined) return;

    const googleId = data.sub;
    const newKey = uuidv4();
    const userResult = await p.usersCollection.findOneAndUpdate(
      { googleId: googleId },
      {
        $push: {
          socketIds: p.socket.id,
          aadKeys: newKey,
        },
        $setOnInsert: (<Omit<User, "socketIds" | "aadKeys">>{//
          // socketIds: [p.socket.id],
          // aadKeys: [newKey],
          googleId: googleId,
          data: data,
          name: data.name,
          gameRequestId: null,
          outInvitation: null,
          ongoingGamesIds: [],
          ratings: [1200, 1000, 1000, 1200, 1200],
          friends: [],
          friendRequests: [],
          invitations: [],
        })
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

    emitToUser(p, userResult.value, "signedIn",
      { id: p.userId, key: newKey },
      { name: user.name, picture: user.data.picture }
    );
  });
}