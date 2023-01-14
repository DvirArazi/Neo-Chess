import { Collection, MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { OAuth2Client, } from 'google-auth-library';
import { Terminal } from './utils/terminal';
import handleCreateGameRequest from './eventHandlers/handleCreateGameRequest';
import { HandleSignIn } from './eventHandlers/handleSignIn';
import { HandleAutoSignIn } from './eventHandlers/handleAutoSignIn';
import { HandleSignOut } from './eventHandlers/handleSignOut';
import { HandleDisconnect } from './eventHandlers/handleDisconnect';
import { Game, ServerSocket, User, WebSocketServer } from './utils/types';
import handleGetGameViewData from './eventHandlers/handleGetGameViewData';
import { GameRequest } from 'shared/types/gameTypes';
import handlePlayerMoved from 'backend/src/eventHandlers/handlePlayerMove';

export default async function handleSocket(webSocketServer: WebSocketServer) {
  const date = new Date();

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
  const usersCollection = db.collection<User>("Users");
  const gameRequestsCollection = db.collection<GameRequest>("GameRequests");
  const ongoingGamesCollection = db.collection<Game>("OngoingGames");

  usersCollection.deleteMany({}); //remove in production
  gameRequestsCollection.deleteMany({});
  ongoingGamesCollection.deleteMany({}); //remove in production

  webSocketServer.on("connection", (socket) => {
    const handlerParams: HandlerParams = {
      date: date,
      webSocketServer: webSocketServer,
      socket: socket,
      userId: undefined,
      oAuth2Client: oAuth2Client,
      usersCollection: usersCollection,
      gameRequestsCollection: gameRequestsCollection,
      ongoingGamesCollection: ongoingGamesCollection,
    };

    HandleSignIn(handlerParams);
    HandleAutoSignIn(handlerParams);
    HandleSignOut(handlerParams);
    handleCreateGameRequest(handlerParams);
    handleGetGameViewData(handlerParams);
    handlePlayerMoved(handlerParams);
    HandleDisconnect(handlerParams);
  });
};

export type HandlerParams = {
  date: Date,
  webSocketServer: WebSocketServer,
  socket: ServerSocket,
  userId: ObjectId | undefined,
  oAuth2Client: OAuth2Client,
  usersCollection: Collection<User>,
  gameRequestsCollection: Collection<GameRequest>,
  ongoingGamesCollection: Collection<Game>,
}
