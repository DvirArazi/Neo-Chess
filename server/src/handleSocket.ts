import { SocketServer, Game } from './utils/types'
import { MongoClient, ServerApiVersion } from 'mongodb';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { User } from 'shared/types';
import { generateKeySync } from 'crypto';
// import { removeFirst } from 'shared/funcs';

let USERS: User[] = [];

export default async function handleSocket(webSocketServer: SocketServer) {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  // const uri = `mongodb+srv://DvirArazi:${process.env.MONGODB_PASSWORD}@cluster0.t5tdz9u.mongodb.net/?retryWrites=true&w=majority`;
  // const client = new MongoClient(uri, {
  //   serverApi: ServerApiVersion.v1
  // });

  try {
    // await client.connect();
    // console.log("Connected successfully to the server.");
    // const db = client.db("NeoChessDB");
    // const collection = db.collection<Game>("Games");

    webSocketServer.on("connection", (socket) => {
      let userId: string | undefined = undefined;

      socket.on("signIn", async (idToken) => {
        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (payload === undefined) {
          console.warn('"payload" is undefined.');
          return;
        }

        const id = payload.sub;
        const newKey = generateKeySync("hmac", { length: 64 }).export().toString("hex");
        label: {
          for (const user of USERS) {
            if (user.id === id) {
              user.keys.push(newKey);
              break label;
            }
          }

          USERS.push({ id: id, keys: [newKey], data: payload });
        }

        userId = id;
        console.log(`userId: ${userId}`);
        socket.emit("signedIn", { id: id, key: newKey }, payload);
      });

      socket.on("autoSignIn", (aad) => {
        const user = USERS.find(user => user.id === aad.id);
        if (user === undefined) {
          console.warn('User with specified ID not found.');
          return;
        }

        userId = aad.id;

        socket.emit("autoSignedIn", (user.data));
      });

      socket.on("signOut", (aad) => {
        if (userId !== aad.id) {
          console.warn('IDs do not match.');
          return;
        }

        const user = USERS.find(user => user.id === userId);
        if (user === undefined) {
          console.error('User with specified ID not found.');
          return;
        }

        // removeFirst(user.keys, aad.key);

        socket.emit("signedOut");
      });

      socket.on("openGameRequest", (clock, onCreated) => {
        if (userId === undefined) {
          console.warn('Attempt to open a game request by an unauthenticated user.');
          return;
        }



        onCreated("stringstring");
      });
    });


  } finally {
    // client.close()
  }
};