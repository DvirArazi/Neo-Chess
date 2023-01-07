import { Game, WebSocketServer, User, HandlerParams } from './utils/types'
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { OAuth2Client, } from 'google-auth-library';
import { TimeFormats, GameRequest } from 'shared/types';
import { generateKeySync } from 'crypto';
import { Terminal } from './utils/terminal';
import { generateBoardLayout } from './utils/tools';
import { timeFormatByTimeframe } from 'shared/tools';
import handleOpenGameRequest from './eventHandlers/handleOpenGameRequest';
import { HandleSignIn } from './eventHandlers/handleSignIn';
import { HandleAutoSignIn } from './eventHandlers/handleAutoSignIn';
import { HandleSignOut } from './eventHandlers/handleSignOut';
import { HandleDisconnect } from './eventHandlers/handleDisconnect';

export default async function handleSocket(webSocketServer: WebSocketServer) {
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

    //===========
    //  Sign In
    //===========
    HandleSignIn(handlerParams);

    //================
    //  Auto Sign In
    //================
    HandleAutoSignIn(handlerParams);

    //============
    //  Sign Out
    //============
    HandleSignOut(handlerParams);

    //=====================
    //  Open Game Request
    //=====================
    handleOpenGameRequest(handlerParams);

    //==============
    //  Disconnect
    //==============
    HandleDisconnect(handlerParams);

  });
};