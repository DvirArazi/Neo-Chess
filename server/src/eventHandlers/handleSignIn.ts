import { generateKeySync } from "crypto";
import { TimeFormats } from "shared/types";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { User } from "../utils/types";
import { v4 as uuidv4 } from 'uuid';

export function HandleSignIn(p: HandlerParams) {
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
    const user = await p.usersCollection.findOneAndUpdate(
      { googleId: googleId },
      {
        $push: { keys: newKey },
        $setOnInsert: <Omit<User, "keys">>{
          googleId: googleId,
          socketsIds: [p.socket.id],
          data: data,
          name: data.name,
          gameRequestId: undefined,
          ongoingGamesIds: [],
          ratings: [1200, 1000, 1000, 1200, 1200],
        }
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );
    if (user.value === null) {
      Terminal.error("Could not find or create user");
      return;
    }

    p.userId = user.value._id;
    p.socket.emit("signedIn", { id: p.userId, key: newKey }, data);
  });
}