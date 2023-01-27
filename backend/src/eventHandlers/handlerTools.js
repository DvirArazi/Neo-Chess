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
import { toValidId } from "backend/src/utils/tools/general";
import { remove } from "shared/tools/general";
export default function leave(p, isSigningOut) {
    return __awaiter(this, void 0, void 0, function () {
        var userResult, user, entry;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Terminal.log('----leaving----');
                    if (p.userId === undefined) {
                        return [2 /*return*/, undefined];
                    }
                    return [4 /*yield*/, p.usersCollection.findOneAndUpdate({
                            _id: toValidId(p.userId),
                        }, { $pull: { "socketsIds": { values: [p.socket.id] } } }, { returnDocument: "before" })];
                case 1:
                    userResult = _a.sent();
                    if (userResult.value === null) {
                        Terminal.warning('User signed out with an invalid ID');
                        p.socket.emit("signedOut");
                        return [2 /*return*/, undefined];
                    }
                    user = userResult.value;
                    entry = user.socketsIds.find(function (entry) { return entry.values.includes(p.socket.id); });
                    if (entry === undefined) {
                        Terminal.warning('Couldn\'t find an entry matching the key sent by the user');
                        return [2 /*return*/, undefined];
                    }
                    if (!remove(entry.values, p.socket.id)) {
                        Terminal.warning('Could\'t find a value matching the current socket ID');
                        return [2 /*return*/, undefined];
                    }
                    if (!(entry.values.length !== 0 || !isSigningOut)) return [3 /*break*/, 3];
                    return [4 /*yield*/, p.usersCollection.updateOne({ _id: user._id }, //supposed to be valid, but make sure if something goes wrong
                        { $push: { socketsIds: entry } })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    //removes the user's game request, if one exists, but only if socketsIds is empty
                    //(meaning the user is disconnected everywhere)
                    //===============================================================================
                    if (user.socketsIds.length === 0) {
                        p.gameRequestsCollection.deleteOne({ _id: user.gameRequestId });
                        p.usersCollection.updateOne({ _id: user._id }, { $set: { gameRequestId: undefined } });
                    }
                    return [2 /*return*/, user];
            }
        });
    });
}
