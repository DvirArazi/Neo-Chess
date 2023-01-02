import RpcServer, { Game } from './utils/types'
import { MongoClient, ServerApiVersion } from 'mongodb';

const handleSocket = async (webSocketServer: RpcServer) => {
  console.log(process.env.MONGODB_PASSWORD);

  const uri = `mongodb+srv://DvirArazi:${process.env.MONGODB_PASSWORD}@cluster0.t5tdz9u.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, {
    serverApi: ServerApiVersion.v1
  });

  try {
    await client.connect();
    console.log("Connected successfully to the server.");
    const db = client.db("NeoChessDB");
    const collection = db.collection<Game>("Games");


    webSocketServer.on("connection", (socket) => {
      socket.on("createGame", (clock, onCreated) => {
        console.log("hello");
        collection.insertOne({
          white: "Dvir",
          black: "Shlaiv",
        });

        onCreated("stringstring");
      });
    });


  } finally {
    // client.close()
  }
};

export default handleSocket;