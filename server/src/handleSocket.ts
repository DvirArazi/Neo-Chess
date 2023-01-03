import { SocketServer, Game } from './utils/types'
import { MongoClient, ServerApiVersion } from 'mongodb';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

const handleSocket = async (webSocketServer: SocketServer) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

      socket.on("authenticate", async (credential) => {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (payload === undefined) {
          console.error("payload is undefined");
          return;
        }

        socket.emit("authenticated", payload);
      });

      socket.on("openGameRequest", (tid, clock, onCreated) => {
        // collection.insertOne({
        //   white: "Dvir",
        //   black: "Shlaiv",
        // });

        onCreated("stringstring");
      });
    });


  } finally {
    // client.close()
  }
};

export default handleSocket;