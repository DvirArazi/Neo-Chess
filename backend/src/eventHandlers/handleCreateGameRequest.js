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
import { timeframeToTimeFormat } from "shared/tools/general";
import { Terminal } from "../utils/terminal";
import { emitToUser, toValidId } from "../utils/tools/general";
import { v4 as uuidv4 } from 'uuid';
import { boardLayoutToRep } from "shared/tools/rep";
import { generateStart, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameStatusCatagory } from "shared/types/game";
export default function handleCreateGameRequest(p) {
    var _this = this;
    p.socket.on("createGameRequest", function (timeframe, isRated, ratingRelMin, ratingRelMax) { return __awaiter(_this, void 0, void 0, function () {
        var user0, timeFormat, user0Rating, ratingAbsMin, ratingAbsMax, deletedGameRequest, newGameRequest, otherUserId, user1, player0, player1, start, isUser0White, path, game;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (p.userId === undefined) {
                        Terminal.warning('Attempt to open a game request by an unauthenticated user');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, p.usersCollection.findOne({ _id: toValidId(p.userId) })];
                case 1:
                    user0 = _a.sent();
                    if (user0 === null) {
                        Terminal.error('Could not find document of the saved user ID');
                        return [2 /*return*/];
                    }
                    timeFormat = timeframeToTimeFormat(timeframe);
                    user0Rating = user0.ratings[timeFormat];
                    ratingAbsMin = user0Rating + ratingRelMin;
                    ratingAbsMax = user0Rating + ratingRelMax;
                    return [4 /*yield*/, p.gameRequestsCollection.findOneAndDelete({
                            userId: { $ne: toValidId(p.userId) },
                            ratingAbsMin: { $lte: ratingAbsMin },
                            ratingAbsMax: { $gte: ratingAbsMax },
                        })];
                case 2:
                    deletedGameRequest = _a.sent();
                    Terminal.log("found a request? ".concat(deletedGameRequest.value !== null));
                    if (!(deletedGameRequest.value === null)) return [3 /*break*/, 4];
                    return [4 /*yield*/, p.gameRequestsCollection.findOneAndReplace({ userId: toValidId(p.userId) }, {
                            userId: toValidId(p.userId),
                            isRated: isRated,
                            timeframe: timeframe,
                            ratingAbsMin: ratingAbsMin,
                            ratingAbsMax: ratingAbsMax,
                        }, {
                            upsert: true,
                            returnDocument: "after",
                        })];
                case 3:
                    newGameRequest = _a.sent();
                    if (newGameRequest.value === null) {
                        Terminal.error('Could not replace or create a new game request');
                        return [2 /*return*/];
                    }
                    p.usersCollection.findOneAndUpdate({ _id: toValidId(p.userId) }, { $set: { gameRequestId: newGameRequest.value._id } });
                    return [2 /*return*/];
                case 4:
                    otherUserId = deletedGameRequest.value.userId;
                    return [4 /*yield*/, p.usersCollection.findOne({ _id: toValidId(otherUserId) })];
                case 5:
                    user1 = _a.sent();
                    if (user1 === null) {
                        Terminal.error('Could not find document of the matching user');
                        return [2 /*return*/];
                    }
                    player0 = {
                        id: user0._id,
                        name: user0.name,
                        rating: user0.ratings[timeFormat] //[timeFormat as number]
                    };
                    player1 = {
                        id: user1._id,
                        name: user1.name,
                        rating: user1.ratings[timeFormat] //[timeFormat as number]
                    };
                    start = generateStart();
                    isUser0White = Math.random() < 0.5;
                    path = uuidv4();
                    return [4 /*yield*/, p.ongoingGamesCollection.insertOne({
                            path: path,
                            white: isUser0White ? player0 : player1,
                            black: isUser0White ? player1 : player0,
                            timeframe: timeframe,
                            isRated: isRated,
                            start: start,
                            startRep: boardLayoutToRep(startAndTurnsToBoardLayout(start, [])),
                            turns: [],
                            timeLastTurnMs: p.date.getTime(),
                            status: { catagory: GameStatusCatagory.Ongoing }
                        })];
                case 6:
                    game = _a.sent();
                    p.usersCollection.updateOne({ _id: user0._id }, { $push: { ongoingGamesIds: game.insertedId } });
                    p.usersCollection.updateOne({ _id: user1._id }, { $push: { ongoingGamesIds: game.insertedId } });
                    emitToUser(p.webSocketServer, user0, "createdGame", path);
                    emitToUser(p.webSocketServer, user1, "createdGame", path);
                    return [2 /*return*/];
            }
        });
    }); });
}
