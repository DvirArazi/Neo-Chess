import { Collection, MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { OAuth2Client, } from 'google-auth-library';
import { Terminal } from './utils/terminal';
import handleCreateGameRequest from './eventHandlers/handleCreateGameRequest';
import { handleSignIn } from './eventHandlers/handleSignIn';
import { handleAutoSignIn } from './eventHandlers/handleAutoSignIn';
import { handleSignOut } from './eventHandlers/handleSignOut';
import { handleDisconnect } from './eventHandlers/handleDisconnect';
import { Game, ServerSocket, User, WebSocketServer } from './utils/types';
import handleGetGameViewData from './eventHandlers/handleGetGameViewData';
import { GameRequest } from 'shared/types/game';
import handlePlayerMoved from 'backend/src/eventHandlers/handlePlayerMove';
import handleGetHomeData from 'backend/src/eventHandlers/handleGetHomeData';
import handleGetSignedInRowData from 'backend/src/eventHandlers/handleGetSignedInRowData';
import handleGetFriendsSearchData from 'backend/src/eventHandlers/handleGetFriendsSearchData';
import handleFriendRequest from 'backend/src/eventHandlers/handleFriendRequest';
import handleResponseToFriendRequest from 'backend/src/eventHandlers/handleResponseToFriendRequest';
import handleDeleteFriend from 'backend/src/eventHandlers/handleDeleteFriend';

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
  const usersCollection = db.collection<User>("Users");
  const gameRequestsCollection = db.collection<GameRequest>("GameRequests");
  const ongoingGamesCollection = db.collection<Game>("OngoingGames");

  usersCollection.deleteMany({}); //remove in production
  gameRequestsCollection.deleteMany({});
  ongoingGamesCollection.deleteMany({}); //remove in production

  webSocketServer.on("connection", (socket) => {
    const handlerParams: HandlerParams = {
      webSocketServer: webSocketServer,
      socket: socket,
      userId: undefined,
      oAuth2Client: oAuth2Client,
      usersCollection: usersCollection,
      gameRequestsCollection: gameRequestsCollection,
      ongoingGamesCollection: ongoingGamesCollection,
    };

    handleSignIn(handlerParams);
    handleAutoSignIn(handlerParams);
    handleSignOut(handlerParams);
    handleGetSignedInRowData(handlerParams);
    handleGetHomeData(handlerParams);
    handleGetFriendsSearchData(handlerParams);
    handleFriendRequest(handlerParams);
    handleResponseToFriendRequest(handlerParams);
    handleDeleteFriend(handlerParams);
    handleCreateGameRequest(handlerParams);
    handleGetGameViewData(handlerParams);
    handlePlayerMoved(handlerParams);
    handleDisconnect(handlerParams);
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
