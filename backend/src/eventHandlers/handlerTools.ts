import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { toValidId } from "backend/src/utils/tools";
import { User } from "backend/src/utils/types";
import { remove } from "shared/tools";
import { AutoAuthData } from "shared/types/webSocketTypes";

export default async function leave(p: HandlerParams, isSigningOut: boolean): Promise<User | undefined> {
  Terminal.log('----leaving----');
  
  if (p.userId === undefined) {
    return undefined;
  }

  //removes the socket.id entry with the matching key
  //replaces it with a new entry with the same key but without the current socket ID
  //===================================================*****************************
  const userResult = await p.usersCollection.findOneAndUpdate(
    {
      _id: toValidId(p.userId),
    },
    { $pull: { "socketsIds": { values: [p.socket.id] } } },
    { returnDocument: "before" },
  );
  if (userResult.value === null) {
    Terminal.warning('User signed out with an invalid ID');
    p.socket.emit("signedOut");
    return undefined;
  }
  const user = userResult.value;

  const entry = user.socketsIds.find(entry => entry.values.includes(p.socket.id));
  if (entry === undefined) {
    Terminal.warning('Couldn\'t find an entry matching the key sent by the user');
    return undefined;
  }

  if (!remove(entry.values, p.socket.id)) {
    Terminal.warning('Could\'t find a value matching the current socket ID');
    return undefined;
  }

  //pushes the entry back to the socketsIds list only if it's not empty
  //(meaning every socket on that specific device closed) 
  //-------------------------------------------------------------------
  if (entry.values.length !== 0 || !isSigningOut) {
    await p.usersCollection.updateOne(
      { _id: user._id }, //supposed to be valid, but make sure if something goes wrong
      { $push: { socketsIds: entry } }
    );
  }

  //removes the user's game request, if one exists, but only if socketsIds is empty
  //(meaning the user is disconnected everywhere)
  //===============================================================================
  if (user.socketsIds.length === 0) {
    p.gameRequestsCollection.deleteOne({ _id: user.gameRequestId });
    p.usersCollection.updateOne(
      { _id: user._id },
      { $set: { gameRequestId: undefined } },
    );
  }

  return user;
}