import { getOngoingGamesTd, toValidId } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { turnsToColor } from "shared/tools/board";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameRequestTd, GameTd } from "shared/types/general";
import { PieceColor } from "shared/types/piece";

export default function handleGetSignedInRowData(p: HandlerParams) {
  p.socket.on("getSignedInRowData", async (callback) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to get SignedIn row data without being signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
    if (user === null) {
      Terminal.error('User is signed in but it\'s ID could not be found in the DB');
      return;
    }

    const gameRequest = user.gameRequestId === null ? null :
      await p.gameRequestsCollection.findOne({ _id: toValidId(user.gameRequestId) });

    const gamesTd = await getOngoingGamesTd(p, user);

    const requestTd: GameRequestTd | null = (() => {
      if (gameRequest !== null) {
        return {
          timeframe: gameRequest.timeframe,
          isRated: gameRequest.isRated,
          isByRating: true,
          ratingAbsMin: gameRequest.ratingAbsMin,
          ratingAbsMax: gameRequest.ratingAbsMax,
        }
      }
      if (user.outInvitation !== null) {
        return {
          timeframe: user.outInvitation.timeframe,
          isRated: user.outInvitation.isRated,
          isByRating: false,
          opponentName: user.outInvitation.name,
        }
      }

      return null;
    })()

    callback(
      {
        ongoingGamesTd: gamesTd,
        invitations: user.invitations,
        requestTd: requestTd,
      },
      {
        friends: user.friends,
        friendRequests: user.friendRequests
      }
    );
  });
}