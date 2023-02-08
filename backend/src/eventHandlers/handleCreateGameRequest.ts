import { timeframeToTimeFormat } from "shared/tools/general";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { v4 as uuidv4 } from 'uuid';
import { boardLayoutToRep } from "shared/tools/rep";
import { BOARD_SIDE, generateStart, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameStatusCatagory, Player } from "shared/types/game";
import { deleteOutInvitationForFriend, emitToUser } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import ongoingGamesInsert from "backend/src/collectionOperations/ongoingGamesInsert";

export default function handleCreateGameRequest(p: HandlerParams) {
  p.socket.on("createGameRequest", async (timeframe, isRated, ratingRelMin, ratingRelMax) => {
    if (p.userId === undefined) {
      Terminal.warning('Attempt to open a game request by an unauthenticated user');
      return;
    }
    const user0 = (await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(p.userId) },
      { $set: { outInvitation: null } },
      { returnDocument: "before" }
    )).value;
    if (user0 === null) {
      Terminal.error('Could not find document of the saved user ID');
      return;
    }

    deleteOutInvitationForFriend(p, user0);

    const timeFormat = timeframeToTimeFormat(timeframe);
    const user0Rating = user0.ratings[timeFormat];
    const ratingAbsMin = user0Rating + ratingRelMin;
    const ratingAbsMax = user0Rating + ratingRelMax;

    const deletedGameRequest = await p.gameRequestsCollection.findOneAndDelete({
      userId: { $ne: p.userId },
      ratingAbsMin: { $lte: ratingAbsMin },
      ratingAbsMax: { $gte: ratingAbsMax },
    });

    //if a request with matching settings was not found
    //====================================*******====== 
    if (deletedGameRequest.value === null) {
      const newGameRequest = await p.gameRequestsCollection.findOneAndReplace(
        { userId: p.userId },
        {
          userId: p.userId,
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

      p.usersCollection.updateOne(
        { _id: new ObjectId(p.userId) },
        { $set: { gameRequestId: newGameRequest.value._id.toString(), outInvitation: null } }
      );

      emitToUser(p, user0, "gameRequestUpdated", {
        timeframe: newGameRequest.value.timeframe,
        isRated: newGameRequest.value.isRated,
        isByRating: true,
        ratingAbsMin: ratingAbsMin,
        ratingAbsMax: ratingAbsMax
      });

      return;
    }

    //if a request with matching settings was found
    //====================================***======
    const otherUserId = deletedGameRequest.value.userId;
    const user1 = await p.usersCollection.findOne({ _id: new ObjectId(otherUserId) });
    if (user1 === null) {
      Terminal.error('Could not find document of the matching user');
      return;
    }
    const player0: Player = {
      id: user0._id.toString(),
      name: user0.name,
      rating: user0.ratings[timeFormat]
    }
    const player1: Player = {
      id: user1._id.toString(),
      name: user1.name,
      rating: user1.ratings[timeFormat]
    }

    const start = generateStart();
    const isUser0White = Math.random() < 0.5;
    const path = uuidv4();
    ongoingGamesInsert(p, {
      path: path,
      white: isUser0White ? player0 : player1,
      black: isUser0White ? player1 : player0,
      timeframe: timeframe,
      isRated: isRated,
      start: start,
      startRep: boardLayoutToRep(startAndTurnsToBoardLayout(start, [])),
      turns: [],
      timeLastTurnMs: new Date().getTime(),
      status: { catagory: GameStatusCatagory.Ongoing },
      timeoutId: null
    });
  });
}