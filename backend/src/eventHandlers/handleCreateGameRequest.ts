import { timeframeToTimeFormat } from "shared/tools/general";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { emitToUser, toValidId } from "../utils/tools/general";
import { v4 as uuidv4 } from 'uuid';
import { PlayerWithId } from "../utils/types";
import { PieceType } from "shared/types/piece";
import { boardLayoutToRep } from "shared/tools/rep";
import { BOARD_SIDE, generateStart, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameStatusCatagory } from "shared/types/game";

export default function handleCreateGameRequest(p: HandlerParams) {
  p.socket.on("createGameRequest", async (timeframe, isRated, ratingRelMin, ratingRelMax) => {
    if (p.userId === undefined) {
      Terminal.warning('Attempt to open a game request by an unauthenticated user');
      return;
    }
    const user0 = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
    if (user0 === null) {
      Terminal.error('Could not find document of the saved user ID');
      return;
    }

    const timeFormat = timeframeToTimeFormat(timeframe);
    const user0Rating = user0.ratings[timeFormat];
    const ratingAbsMin = user0Rating + ratingRelMin;
    const ratingAbsMax = user0Rating + ratingRelMax;

    const deletedGameRequest = await p.gameRequestsCollection.findOneAndDelete({
      userId: { $ne: toValidId(p.userId) },
      ratingAbsMin: { $lte: ratingAbsMin },
      ratingAbsMax: { $gte: ratingAbsMax },
    });

    Terminal.log(`found a request? ${deletedGameRequest.value !== null}`);

    //if a request with matching settings was not found
    //====================================*******====== 
    if (deletedGameRequest.value === null) {
      const newGameRequest = await p.gameRequestsCollection.findOneAndReplace(
        { userId: toValidId(p.userId) },
        {
          userId: toValidId(p.userId),
          isRated: isRated,
          timeframe: timeframe,
          ratingAbsMin: ratingAbsMin,
          ratingAbsMax: ratingAbsMax,
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );
      if (newGameRequest.value === null) {
        Terminal.error('Could not replace or create a new game request');
        return;
      }

      p.usersCollection.findOneAndUpdate(
        { _id: toValidId(p.userId) },
        { $set: { gameRequestId: newGameRequest.value._id } }
      );
      return;
    }

    //if a request with matching settings was found
    //====================================***======
    const otherUserId = deletedGameRequest.value.userId;
    const user1 = await p.usersCollection.findOne({ _id: toValidId(otherUserId) });
    if (user1 === null) {
      Terminal.error('Could not find document of the matching user');
      return;
    }
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

    const start = generateStart();
    const isUser0White = Math.random() < 0.5;
    const path = uuidv4();
    const game = await p.ongoingGamesCollection.insertOne({
      path: path,
      white: isUser0White ? player0 : player1,
      black: isUser0White ? player1 : player0,
      timeframe: timeframe,
      isRated: isRated,
      start: start,
      startRep: boardLayoutToRep(startAndTurnsToBoardLayout(start, [])),
      turns: [],
      timeLastTurnMil: p.date.getTime(),
      status: { catagory: GameStatusCatagory.Ongoing }
    });

    p.usersCollection.updateOne({ _id: user0._id }, { $push: { ongoingGamesIds: game.insertedId } });
    p.usersCollection.updateOne({ _id: user1._id }, { $push: { ongoingGamesIds: game.insertedId } });

    emitToUser(p.webSocketServer, user0, "createdGame", path);
    emitToUser(p.webSocketServer, user1, "createdGame", path);
  });
}