import { BackendParams } from "backend/src/handleSocket";
import { toValidId } from "backend/src/utils/tools/general";


export default function watchUsers(p: BackendParams) {
  // p.usersCollection.watch().on('change', (e) => {
  //   const ongoingGamesIds
  //   if (e.operationType === 'update' && e.updateDescription.updatedFields?.ongoingGamesIds) {
  //     const game = p.ongoingGamesCollection.findOne({_id: toValidId()})
  //   }
  // });
}