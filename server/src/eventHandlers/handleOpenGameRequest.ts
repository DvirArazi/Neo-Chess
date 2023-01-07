import { timeFormatByTimeframe } from "shared/tools";
import { GameSettings } from "shared/types";
import { Terminal } from "../utils/terminal";
import { generateBoardLayout } from "../utils/tools";
import { HandlerParams, ServerSocket, WebSocketServer } from "../utils/types";

export default function handleOpenGameRequest(p: HandlerParams) {
const {
  webSocketServer, 
  socket,
  userId,
  usersCollection,
  gameRequestsCollection,
  ongoingGamesCollection,
} = p;
socket.on("openGameRequest", async (gameSettings)=>{

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
}
