var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools/general";
import { getLegalMoves, isInCheckmate, isKingCaptured, startAndTurnsToBoardLayout, step } from "shared/tools/boardLayout";
import Lodash from "lodash";
import { DrawReason, GameStatusCatagory, WinReason } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";
import { getOppositeColor } from "shared/tools/piece";
import { boardLayoutToRep, hasCausedRepetition } from "shared/tools/rep";
import { pointsToAction } from "shared/tools/board";
export default function handlePlayerMoved(p) {
    var _this = this;
    Terminal.warning('delete 0');
    p.socket.on("playerMove", function (gameId, from, to, promotion) { return __awaiter(_this, void 0, void 0, function () {
        var user, game, turnColor, layout, legalMovesResult, legalMoves, whiteTime, turn, gameAfterResult, gameAfter, otherUserId, otherUser, layoutAfter, status;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (p.userId === undefined) {
                        Terminal.warning('User attempted to play a turn in an online game without being registered');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, p.usersCollection.findOne({ _id: toValidId(p.userId) })];
                case 1:
                    user = _a.sent();
                    if (user === null) {
                        Terminal.error('Couldn\'nt find user with saved user ID');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, p.ongoingGamesCollection.findOne({ _id: toValidId(gameId) })];
                case 2:
                    game = _a.sent();
                    if (game === null) {
                        Terminal.warning('Couldn\'nt find game using the id provided by the user');
                        return [2 /*return*/];
                    }
                    turnColor = (function () {
                        if (game.white.id.toString() === user._id.toString())
                            return PieceColor.White;
                        if (game.black.id.toString() === user._id.toString())
                            return PieceColor.Black;
                        return undefined;
                    })();
                    if (turnColor === undefined) {
                        Terminal.warning('The user who tried to play a turn is not part of that game');
                        return [2 /*return*/];
                    }
                    if (turnColor !== (game.turns.length % 2 == 0 ? PieceColor.White : PieceColor.Black)) {
                        Terminal.warning('The user who tried to play the current turn is of the opposite color');
                        return [2 /*return*/];
                    }
                    layout = startAndTurnsToBoardLayout(game.start, game.turns);
                    if (promotion !== null && !isPromotionValid(layout, turnColor, promotion)) {
                        Terminal.warning('The user tried to promote to an invalid piece');
                        return [2 /*return*/];
                    }
                    legalMovesResult = getLegalMoves(layout, turnColor, from);
                    if (!legalMovesResult.ok) {
                        Terminal.warning(legalMovesResult.error);
                        return [2 /*return*/];
                    }
                    legalMoves = legalMovesResult.value;
                    if (!Lodash.some(legalMoves, to)) {
                        Terminal.warning('The move sent by the user is illigal');
                        return [2 /*return*/];
                    }
                    whiteTime = (function () {
                        if (game.turns.length !== 0) {
                            var lastTurn = game.turns[game.turns.length - 1];
                            var delta = p.date.getTime() - game.timeLastTurnMs;
                            return lastTurn.timeLeftMs - delta;
                        }
                        else {
                            return game.timeframe.overallSec;
                        }
                    })();
                    turn = {
                        action: pointsToAction(from, to),
                        timeLeftMs: whiteTime,
                        promotionType: promotion,
                        rep: boardLayoutToRep(step(layout, from, to, promotion)),
                    };
                    return [4 /*yield*/, p.ongoingGamesCollection.findOneAndUpdate({ _id: game._id }, /*This id has to be valid, right?*/ {
                            $push: {
                                turns: turn
                            }
                        }, { returnDocument: "after" })];
                case 3:
                    gameAfterResult = _a.sent();
                    if (gameAfterResult.value === null) {
                        Terminal.error('Could not find and update game');
                        return [2 /*return*/];
                    }
                    gameAfter = gameAfterResult.value;
                    otherUserId = turnColor ? game.white.id : game.black.id;
                    return [4 /*yield*/, p.usersCollection.findOne({ _id: toValidId(otherUserId) })];
                case 4:
                    otherUser = _a.sent();
                    if (otherUser === null) {
                        Terminal.error('Could not find other user saved on game');
                        return [2 /*return*/];
                    }
                    layoutAfter = startAndTurnsToBoardLayout(gameAfter.start, gameAfter.turns);
                    status = (function () {
                        if (isKingCaptured(layoutAfter, getOppositeColor(turnColor))) {
                            return {
                                catagory: GameStatusCatagory.Win,
                                winColor: turnColor,
                                reason: WinReason.KingCaptured,
                            };
                        }
                        if (isInCheckmate(layoutAfter, getOppositeColor(turnColor))) {
                            return {
                                catagory: GameStatusCatagory.Win,
                                winColor: turnColor,
                                reason: WinReason.Checkmate,
                            };
                        }
                        if (hasCausedRepetition(gameAfter.turns, gameAfter.startRep)) {
                            return {
                                catagory: GameStatusCatagory.Draw,
                                reason: DrawReason.Repetition,
                            };
                        }
                        return { catagory: GameStatusCatagory.Ongoing };
                    })();
                    emitToUser(p.webSocketServer, user, "playerMoved", gameId, turn, status);
                    emitToUser(p.webSocketServer, otherUser, "playerMoved", gameId, turn, status);
                    return [2 /*return*/];
            }
        });
    }); });
}
function isPromotionValid(layout, turnColor, promotion) {
    var pieceLimits = [
        { type: PieceType.Queen, limit: 1 },
        { type: PieceType.Rook, limit: 2 },
        { type: PieceType.Knight, limit: 2 },
        { type: PieceType.Bishop, limit: 2 },
    ];
    for (var i = 0; i < pieceLimits.length; i++) {
        if (promotion === pieceLimits[i].type) {
            var count = 0;
            for (var _i = 0, layout_1 = layout; _i < layout_1.length; _i++) {
                var square = layout_1[_i];
                if ((square === null || square === void 0 ? void 0 : square.type) === promotion && square.color === turnColor) {
                    count += 1;
                    if (count >= pieceLimits[i].limit) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}
