import { Collection, MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { OAuth2Client, } from 'google-auth-library';
import { GameRequest } from 'shared/types';
import { Terminal } from './utils/terminal';
import handleOpenGameRequest from './eventHandlers/handleCreateGameRequest';
import { HandleSignIn } from './eventHandlers/handleSignIn';
import { HandleAutoSignIn } from './eventHandlers/handleAutoSignIn';
import { HandleSignOut } from './eventHandlers/handleSignOut';
import { HandleDisconnect } from './eventHandlers/handleDisconnect';
import { Game, ServerSocket, User, WebSocketServer } from './utils/types';

export default async function handleSocket(webSocketServer: WebSocketServer) {
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  const uri = `mongodb+srv://DvirArazi:${process.env.MONGODB_PASSWORD}@cluster0.t5tdz9u.mongodb.net/?retryWrites=true`;
  const mongoClient = new MongoClient(uri, {
    serverApi: ServerApiVersion.v1,
  });
  await mongoClient.connect();
  Terminal.log("Connected successfully to the database");
  const db = mongoClient.db("NeoChessDB");

  webSocketServer.on("connection", (socket) => {
    const handlerParams: HandlerParams = {
      webSocketServer: webSocketServer,
      socket: socket,
      userId: undefined,
      oAuth2Client: oAuth2Client,
      usersCollection: db.collection<User>("Users"),
      gameRequestsCollection: db.collection<GameRequest>("GameRequests"),
      ongoingGamesCollection: db.collection<Game>("OngoingGames"),
    };

    HandleSignIn(handlerParams);
    HandleAutoSignIn(handlerParams);
    HandleSignOut(handlerParams);
    handleOpenGameRequest(handlerParams);
    HandleDisconnect(handlerParams);
  });
};

export type HandlerParams = {
  webSocketServer: WebSocketServer,
  socket: ServerSocket,
  userId: ObjectId | undefined,
  oAuth2Client: OAuth2Client,
  usersCollection: Collection<User>,
  gameRequestsCollection: Collection<GameRequest>,
  ongoingGamesCollection: Collection<Game>,
}
