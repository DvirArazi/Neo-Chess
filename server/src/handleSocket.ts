import { SocketServer, Game } from './utils/types'
import { MongoClient, ServerApiVersion } from 'mongodb';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

const handleSocket = async (webSocketServer: SocketServer) => {
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
      let userData: string | undefined = undefined;

      socket.on("authenticate", async (idToken) => {
        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID
        });

        // const please = await client.getToken("");
        const please = await client.getAccessToken();
        
        console.log("please: " + please.token);

        const payload = ticket.getPayload();
        ticket.getUserId();
        if (payload === undefined) {
          console.error('"payload" is undefined.');
          return;
        }
        const id = ticket.getUserId();
        if (ticket === null) {
          console.error('"id" is null.');
          return;
        }

        userData = id!;
        socket.emit("authenticated", payload);
      });

      socket.on("openGameRequest", (clock, onCreated) => {
        if (userData === undefined) {
          console.error('Attempt to open a game request by an unauthenticated user.');
          return;
        }

        

        onCreated("stringstring");
      });
    });


  } finally {
    // client.close()
  }
};

export default handleSocket;