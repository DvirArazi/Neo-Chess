import { timeFormatByTimeframe } from "shared/tools";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { emitToUser, generateBoardLayout, toValidId } from "../utils/tools";
import { v4 as uuidv4 } from 'uuid';
import { PlayerWithId } from "../utils/types";
import { ObjectId } from "mongodb";

export default function handleOpenGameRequest(p: HandlerParams) {
  p.socket.on("createGameRequest", async (gameSettings) => {

    if (p.userId === undefined) {
      Terminal.warning('Attempt to open a game request by an unauthenticated user');
      return;
    }

    const deletedGameRequest = await p.gameRequestsCollection.findOneAndDelete({ data: gameSettings });

    if (deletedGameRequest.value === null) {
      p.gameRequestsCollection.deleteOne({ userId: p.userId });
      p.gameRequestsCollection.insertOne({ userId: p.userId, data: gameSettings });
      return;
    }

    const otherUserId = deletedGameRequest.value.userId; 8
    //{ $push: { ongoingGamesIds: game.insertedId } }
    const user0 = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
    if (user0 === null) {
      Terminal.error('Could not find document of the saved user ID');
      return;
    }
    const user1 = await p.usersCollection.findOne({ _id: toValidId(otherUserId) });
    if (user1 === null) {
      Terminal.error('Could not find document of the matching user');
      return;
    }
    const timeFormat = timeFormatByTimeframe(gameSettings.timeframe);
    const player0: PlayerWithId = {
      id: user0._id,
      name: user0.name,
      rating: user0.ratings[timeFormat]//[timeFormat as number]
    }
    const player1: PlayerWithId = {
      id: user1._id,
      name: user1.name,
      rating: user1.ratings[timeFormat]//[timeFormat as number]
    }

    const boardLayout = generateBoardLayout();
    const isUser0White = Math.random() < 0.5;
    const path = uuidv4();
    const game = await p.ongoingGamesCollection.insertOne({
      path: path,
      white: isUser0White ? player0 : player1,
      black: isUser0White ? player1 : player0,
      settings: gameSettings,
      history: [{
        position: boardLayout,
        whiteTime: gameSettings.timeframe.timePerTurn,
        blackTime: gameSettings.timeframe.timePerTurn,
      }]
    });

    p.usersCollection.updateOne({ _id: user0._id }, { $push: { ongoingGamesIds: game.insertedId } });
    p.usersCollection.updateOne({ _id: user1._id }, { $push: { ongoingGamesIds: game.insertedId } });

    emitToUser(p.webSocketServer, user0, "createdGame", path);
    emitToUser(p.webSocketServer, user1, "createdGame", path);
  });
}
