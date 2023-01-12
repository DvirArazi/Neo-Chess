import { GameRole, EGameRole } from "shared/types/gameTypes";
import { PieceColor } from "shared/types/pieceTypes";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export default function handleGetGameViewData(p: HandlerParams) {
  p.socket.on("getGameViewData", async (path, callback) => {
    const game = await p.ongoingGamesCollection.findOne({ path: path });
    if (game === null) {
      Terminal.warning('Game path does not exist');
      callback("404");
      return;
    }

    const role: GameRole = (() => {
      switch (p.userId) {
        case game.white.id: return PieceColor.White;
        case game.black.id: return PieceColor.Black;
        default: return EGameRole.Viewer;
      };
    })();

    let bla = Buffer.from([1, 2, 3]);

    callback({
      id: game._id,
      role: role,
      ...game,
    });
  });
}