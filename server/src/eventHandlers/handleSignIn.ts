import { generateKeySync } from "crypto";
import { TimeFormats } from "shared/types";
import { Terminal } from "../utils/terminal";
import { HandlerParams, User } from "../utils/types";

export function HandleSignIn(p: HandlerParams) {
const {
  socket,
  oAuth2Client,
  usersCollection,
} = p;
socket.on("signIn", async (idToken)=>{
  const ticket = await oAuth2Client.verifyIdToken({
    idToken: idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const data = ticket.getPayload();
  if (data === undefined) {
    Terminal.warning('"payload" is undefined. Invalid idToken.');
    return;
  }

  const googleId = data.sub;
  const newKey = generateKeySync("hmac", { length: 64 }).export().toString("hex");
  const user = await usersCollection.findOneAndUpdate(
    { googleId: googleId },
    {
      $push: { keys: newKey },
      $setOnInsert: <User>{
        googleId: googleId,
        socketsIds: [socket.id],
        data: data,
        name: data.name,
        keys: [newKey],
        gameRequestId: undefined,
        ongoingGamesIds: [],
        ratings: new Map([
          [TimeFormats.Untimed, 1200],
          [TimeFormats.Bullet, 1000],
          [TimeFormats.Blitz, 1000],
          [TimeFormats.Rapid, 1200],
          [TimeFormats.Classical, 1200],
        ]),
      }
    },
    { upsert: true }
  );
  if (user.value === null) {
    Terminal.error("Could not find or create user");
    return;
  }

  p.userId = user.value._id;
  socket.emit("signedIn", { id: p.userId, key: newKey }, data);
});
}