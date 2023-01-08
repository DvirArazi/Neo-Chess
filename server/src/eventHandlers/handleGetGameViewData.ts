import { GameRole } from "shared/types";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export default function handleGetGameViewData(p: HandlerParams) {
  p.socket.on("getGameViewData", async (path, callback) => {
    const game = await p.ongoingGamesCollection.findOne({ path: path });
    if (game === null) {
      Terminal.warning('Game path does not exist');
      callback(undefined);
      return;
    }

    const role: GameRole = (()=>{
      switch (p.userId) {
        case game.white.id: return GameRole.White;
        case game.black.id: return GameRole.Black;
        default: return GameRole.Viewer;
      };
    })();

    callback({
      role: role,
      ...game
    });
  });
}