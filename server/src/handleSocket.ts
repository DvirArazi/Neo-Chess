import { Game, WebSocketServer, User } from './utils/types'
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { OAuth2Client, } from 'google-auth-library';
import { TimeFormats, GameRequest } from 'shared/types';
import { generateKeySync } from 'crypto';
import { Terminal } from './utils/terminal';
import { generateBoardLayout } from './utils/tools';
import { formatByTimeframe as timeFormatByTimeframe } from 'shared/tools';

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
  const usersCollection = db.collection<User>("Users");
  const gameRequestsCollection = db.collection<GameRequest>("GameRequests");
  const ongoingGamesCollection = db.collection<Game>("OngoingGames");
  // const gamesHistoryCollection = db.collection<>("GamesHistory");

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

      const data = ticket.getPayload();
      if (data === undefined) {
        Terminal.warning('"payload" is undefined. Invalid idToken.');
        return;
      }

      const googleId = data.sub;
      const newKey = generateKeySync("hmac", { length: 64 }).export().toString("hex");
      const user = await usersCollection.findOneAndUpdate(
        { googleId: googleId },
        {
          $push: { keys: newKey },
          $setOnInsert: <User>{
            googleId: googleId,
            socketsIds: [socket.id],
            data: data,
            name: data.name,
            keys: [newKey],
            gameRequestId: undefined,
            ongoingGamesIds: [],
            ratings: new Map([
              [TimeFormats.Untimed, 1200],
              [TimeFormats.Bullet, 1000],
              [TimeFormats.Blitz, 1000],
              [TimeFormats.Rapid, 1200],
              [TimeFormats.Classical, 1200],
            ]),
          }
        },
        { upsert: true }
      );
      if (user.value === null) {
        Terminal.error("Could not find or create user");
        return;
      }

      userId = user.value._id;
      socket.emit("signedIn", { id: userId, key: newKey }, data);
    });

    //================
    //  Auto Sign In
    //================
    socket.on("autoSignIn", async (aad) => {
      const user = await usersCollection.findOne(
        { _id: aad.id, keys: { $in: [aad.key] } }
      );
      if (user === null) {
        Terminal.warning('User auto signed out with an invalid AAD');
        return;
      }

      userId = aad.id;

      socket.emit("autoSignedIn", (user.data));
    });

    //============
    //  Sign Out
    //============
    socket.on("signOut", async (aad) => {
      const user = await usersCollection.findOneAndUpdate(
        { _id: aad.id },
        { $pull: { keys: aad.key } },
        { upsert: true }
      );

      if (user.value === null) {
        Terminal.warning("User signed out with an invalid ID");
      }

      socket.emit("signedOut");
    });

    //=====================
    //  Open Game Request
    //=====================
    socket.on("openGameRequest", async (gameSettings) => {
      if (userId === undefined) {
        Terminal.warning('Attempt to open a game request by an unauthenticated user');
        return;
      }

      const deletedGameRequest = await gameRequestsCollection.findOneAndDelete({ data: gameSettings });

      if (deletedGameRequest.value === null) {
        gameRequestsCollection.insertOne({ userId: userId, data: gameSettings });
        return;
      }

      const otherUserId = deletedGameRequest.value._id;

      const boardLayout = generateBoardLayout();

      const isUser0White = Math.random() < 0.5;
      const game = await ongoingGamesCollection.insertOne({
        white: isUser0White ? userId : deletedGameRequest.value._id,
        black: !isUser0White ? userId : deletedGameRequest.value._id,
        settings: gameSettings,
        boardLayout: boardLayout,
      });

      const user0Result = await usersCollection.findOneAndUpdate({ _id: userId }, { $push: { ongoingGamesIds: game.insertedId } });
      const user1Result = await usersCollection.findOneAndUpdate({ _id: otherUserId }, { $push: { ongoingGamesId: game.insertedId } });
      const user0 = user0Result.value;
      const user1 = user1Result.value;
      if (user0 === null) {
        Terminal.error('Could not find document of the saved user ID');
        return;
      }
      if (user1 === null) {
        Terminal.error('Could not find document of the matching user');
        return;
      }

      const timeFormat = timeFormatByTimeframe(gameSettings.timeframe);
      const player0 = { name: user0.name, rating: user0.ratings.get(timeFormat)! };
      const player1 = { name: user1.name, rating: user1.ratings.get(timeFormat)! };

      socket.emit("gameCreated",
        isUser0White,
        player0,
        player1,
        boardLayout,
        gameSettings,
      );

      user1.socketsIds.forEach((id) => {
        webSocketServer.to(id).emit("gameCreated",
          !isUser0White,
          player1,
          player0,
          boardLayout,
          gameSettings,
        );
      });
    });

    //==============
    //  Disconnect
    //==============
    socket.on("disconnect", async (reaason) => {
      if (userId === undefined) {
        return;
      }

      const user = await usersCollection.findOneAndUpdate(
        { _id: userId },
        {
          $pull: { socketIds: socket.id },
          $set: { gameRequestId: undefined },
        }
      );

      if (user.value === null) {
        Terminal.error('Could not find a user in the database with the saved ID');
        return;
      }

      const gameRequestId = user.value.gameRequestId;

      if (gameRequestId !== undefined) {
        gameRequestsCollection.deleteOne({ _id: gameRequestId });
      }
    });

  });
};