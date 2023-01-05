import { Game, SocketServer } from './utils/types'
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { OAuth2Client, } from 'google-auth-library';
import { User } from 'shared/types';
import { generateKeySync } from 'crypto';
import { removeFirst } from 'shared/funcs';
import { Terminal } from './utils/terminal';

export default async function handleSocket(webSocketServer: SocketServer) {
  Terminal.log("wow!");
  Terminal.error("wow!");
  Terminal.warning("wow!");

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  const uri = `mongodb+srv://DvirArazi:${process.env.MONGODB_PASSWORD}@cluster0.t5tdz9u.mongodb.net/?retryWrites=true&w=majority"`;
  const mongoClient = new MongoClient(uri, {
    serverApi: ServerApiVersion.v1,
  });
  await mongoClient.connect();
  Terminal.log("Connected successfully to the database");
  const db = mongoClient.db("NeoChessDB");
  const usersColl = db.collection<User>("Users");
  const GamesColl = db.collection<Game>("Games");

  webSocketServer.on("connection", (socket) => {
    let userId: ObjectId | undefined = undefined;

    //===========
    //  Sign In
    //===========
    socket.on("signIn", async (idToken) => {
      const ticket = await oAuth2Client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      if (payload === undefined) {
        console.warn('>? "payload" is undefined.');
        return;
      }

      const sub = payload.sub;
      const newKey = generateKeySync("hmac", { length: 64 }).export().toString("hex");
      const user = await usersColl.findOneAndUpdate(
        {sub: sub},
        { $push: {keys: newKey} },
        { upsert: true }
      );
      if (user.value === null) {
        console.error(">! Could not find or create user");
        return;
      }

      userId = user.value._id;
      socket.emit("signedIn", { id: userId, key: newKey }, payload);
    });

    //================
    //  Auto Sign In
    //================
    socket.on("autoSignIn", async (aad) => {
      const user = await usersColl.findOne(
        {_id: aad.id, keys: { $in: [aad.key] }}
      );
      if (user === null) {
        console.warn('>? User with specified ID not found.');
        return;
      }

      userId = aad.id;

      socket.emit("autoSignedIn", (user.data));
    });

    //============
    //  Sign Out
    //============
    socket.on("signOut", async (aad) => {
      if (userId !== aad.id) {
        Terminal.error("User signed out with an unregistered ID");
        socket.emit("signedOut");
        return;
      }

      await usersColl.findOneAndUpdate(
        {_id: aad.id},
        { $pull: {keys: aad.key} },
        { upsert: true }
      );

      socket.emit("signedOut");
    });

    //=====================
    //  Open Game Request
    //=====================
    socket.on("openGameRequest", (clock, onCreated) => {
      if (userId === undefined) {
        console.warn('Attempt to open a game request by an unauthenticated user.');
        return;
      }

      onCreated("stringstring");
    });
  });
};