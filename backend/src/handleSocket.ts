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
import handlePlayerMoved from 'backend/src/eventHandlers/handlePlayerMove';
import handleGetHomeData from 'backend/src/eventHandlers/handleGetHomeData';
import handleGetSignedInRowData from 'backend/src/eventHandlers/handleGetSignedInRowData';
import handleGetFriendsSearchData from 'backend/src/eventHandlers/handleGetFriendsSearchData';
import handleFriendRequest from 'backend/src/eventHandlers/handleFriendRequest';
import handleResponseToFriendRequest from 'backend/src/eventHandlers/handleResponseToFriendRequest';
import handleDeleteFriend from 'backend/src/eventHandlers/handleDeleteFriend';
import { GameRequest } from 'shared/types/game';
import handleDeleteGameRequest from 'backend/src/eventHandlers/handleDeleteGameRequest';
import handleGetFriends from 'backend/src/eventHandlers/handleGetFriends';
import handleSendGameInvitation from 'backend/src/eventHandlers/handleSendGameInvitation';
import handleResponseToInvitation from 'backend/src/eventHandlers/handleResponseToInvitation';
import handleGetHistoryGames from 'backend/src/eventHandlers/handleGetHistoryGames';
import handleResign from 'backend/src/eventHandlers/handleResign';
import handleDrawOffer from 'backend/src/eventHandlers/handleDrawOffer';
import handleDrawResponse from 'backend/src/eventHandlers/handleDrawAccept';
import handleTakebackRequest from 'backend/src/eventHandlers/handleTakebackRequest';
import handleTakebackAccept from 'backend/src/eventHandlers/handleTakebackAccept';

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
  const GamesCollection = db.collection<Game>("Games");

  usersCollection.deleteMany({}); //remove in production
  gameRequestsCollection.deleteMany({});
  GamesCollection.deleteMany({}); //remove in production

  const backendParams: BackendParams = {
    webSocketServer: webSocketServer,
    oAuth2Client: oAuth2Client,
    usersCollection: usersCollection,
    gameRequestsCollection: gameRequestsCollection,
    gamesCollection: GamesCollection,
  }

  webSocketServer.on("connection", (socket) => {
    const handlerParams: HandlerParams = {
      ...backendParams,
      socket: socket,
      userId: undefined,
    };

    handleSignIn(handlerParams);
    handleAutoSignIn(handlerParams);
    handleSignOut(handlerParams);
    handleGetSignedInRowData(handlerParams);
    handleGetHomeData(handlerParams);
    handleGetFriends(handlerParams);
    handleGetFriendsSearchData(handlerParams);
    handleFriendRequest(handlerParams);
    handleResponseToFriendRequest(handlerParams);
    handleResponseToInvitation(handlerParams);
    handleDeleteFriend(handlerParams);
    handleCreateGameRequest(handlerParams);
    handleDeleteGameRequest(handlerParams);
    handleSendGameInvitation(handlerParams);
    handleGetGameViewData(handlerParams);
    handlePlayerMoved(handlerParams);
    handleResign(handlerParams);
    handleDrawOffer(handlerParams);
    handleDrawResponse(handlerParams);
    handleTakebackRequest(handlerParams);
    handleTakebackAccept(handlerParams);
    handleGetHistoryGames(handlerParams);
    handleDisconnect(handlerParams);
  });
};

export type BackendParams = {
  webSocketServer: WebSocketServer,
  oAuth2Client: OAuth2Client,
  usersCollection: Collection<User>,
  gameRequestsCollection: Collection<GameRequest>,
  gamesCollection: Collection<Game>,
}

export type HandlerParams = {
  socket: ServerSocket,
  userId: string | undefined,
} & BackendParams
