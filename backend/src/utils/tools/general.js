var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { ObjectId } from "mongodb";
import { Terminal } from "../terminal";
export function emitToUser(webSocketServer, user, ev) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    user.socketsIds.forEach(function (socketId) {
        var _a;
        Terminal.log("Emitting ".concat(ev, " to {").concat(socketId.key, ", ").concat(socketId.values, "}"));
        (_a = webSocketServer.to(socketId.values)).emit.apply(_a, __spreadArray([ev], args, false));
    });
}
export function toValidId(id) {
    return new ObjectId(id.toString());
}
