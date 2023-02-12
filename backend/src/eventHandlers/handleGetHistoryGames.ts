import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { Game } from "backend/src/utils/types";
import { ObjectId } from "mongodb";
import { turnsToColor } from "shared/tools/board";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { EGameRole, GameViewData } from "shared/types/game";
import { GameTd } from "shared/types/general";
import { PieceColor } from "shared/types/piece";

export default function handleGetHistoryGames(p: HandlerParams) {
  p.socket.on("getHistoryGames", async (callback)=>{
    if (p.userId === undefined) {
      Terminal.warning('User tried to get history games but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({_id: new ObjectId(p.userId)});
    if (user === null) {
      Terminal.error('Saved user ID was not found on DB');
      return;
    }

    let historyGamesTd: GameTd[] = [];
    for (const gameId in user.historyGamesIds) {
      const game = await p.historyGamesCollection.findOne({_id: new ObjectId(gameId)});
      if (game === null) {
        Terminal.error('history game with the ID saved in user was not found in DB');
        continue;
      }

      historyGamesTd.push({
        ...game,
        layout: startAndTurnsToBoardLayout(game.start, game.turns),
        turnColor: turnsToColor(game.turns),
        userColor: p.userId === game.white.id ? PieceColor.White : PieceColor.Black
      });
    }

    callback(historyGamesTd);
  });
}