import GameOffline from "frontend/src/components/pageExclusives/game/GameOffline";
import { useRouter } from "next/router";
import { Timeframe } from "shared/types/game";
import Error from "next/error";

export default function offline() {
  const router = useRouter();
  
  console.log('woopwoop');

  const path = router.query.timeframe as string | undefined;
  if (path === undefined) return;

  console.log('woop')

  const timeframe = pathToTimeframe(path);
  if (timeframe === null) return <Error statusCode={404}/>;
  
  return <GameOffline timeframe={timeframe}/>;
}

function pathToTimeframe(path: string): Timeframe | null {
  if (path === 'untimed') return "untimed";

  const parts = path.split('-');

  if (parts.length < 2) return null;

  const overallSec = parseInt(parts[0]);
  if (Number.isNaN(overallSec)) return null;

  const incrementSec = parseInt(parts[1]);
  if (Number.isNaN(incrementSec)) return null;

  return {overallSec: overallSec, incSec: incrementSec};
}