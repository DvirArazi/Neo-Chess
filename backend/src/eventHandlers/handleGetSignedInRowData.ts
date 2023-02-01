import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools/general";
import { Game } from "backend/src/utils/types";
import { turnsToColor } from "shared/tools/board";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameTd } from "shared/types/general";
import { PieceColor } from "shared/types/piece";

export default function handleGetSignedInRowData(p: HandlerParams) {
  p.socket.on("getSignedInRowData", async (callback)=>{
    if (p.userId === undefined) {
      Terminal.warning('User tried to get SignedIn row data without being signed in');
      return;
    }

    const user = await p.usersCollection.findOne({_id: toValidId(p.userId)});
    if (user === null) {
      Terminal.error('User is signed in but it\'s ID could not be found in the DB');
      return;
    }

    let gamesTd: GameTd[] = [];
    for (const gameId of user.ongoingGamesIds) {
      const game = await p.ongoingGamesCollection.findOne({_id: toValidId(gameId)});
      if (game === null) {
        Terminal.error('Game ID from the user\'s ongoingGamesIds was not found on DB');
        continue;
      }
      gamesTd.push({
        ...game,
        id: game._id,
        layout: startAndTurnsToBoardLayout(game.start, game.turns),
        turnColor: turnsToColor(game.turns),
        userColor: p.userId.toString() === game.white.id.toString() ? PieceColor.White : PieceColor.Black
      });
    }

    callback({
      ongoingGamesTd: gamesTd,
      invitationsTd: [], //update that!!!
      requestTd: null, //update that!!!
    });
  });
}