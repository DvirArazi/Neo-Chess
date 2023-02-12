import { GameRole, EGameRole, GameStatusCatagory } from "shared/types/game";
import { PieceColor } from "shared/types/piece";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export default function handleGetGameViewData(p: HandlerParams) {
  p.socket.on("getGameViewData", async (path, callback) => {
    const game =
      (await p.gamesCollection.findOne({ path: path }));
    if (game === null) {
      Terminal.warning('Game path does not exist');
      callback("404");
      return;
    }

    const role: GameRole = (() => {
      Terminal.log(
        `user ID: ${p.userId?.toString()}\n    ` +
        `white ID: ${game.white.id.toString()}\n    ` +
        `black ID: ${game.black.id.toString()}\n`
      );
      switch (p.userId?.toString()) {
        case game.white.id.toString(): return PieceColor.White;
        case game.black.id.toString(): return PieceColor.Black;
        default: {
          if (game.status.catagory === GameStatusCatagory.Ongoing) {
            p.gamesCollection.updateOne(
              { _id: game._id },
              { $addToSet: { viewerSocketIds: p.socket.id } }
            )
          }

          return EGameRole.Viewer;
        }
      };
    })();

    callback({
      id: game._id.toString(),
      role: role,
      ...game,
    });
  });
}