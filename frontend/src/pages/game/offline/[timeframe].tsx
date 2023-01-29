import GameOffline from "frontend/src/components/pageExclusives/game/GameOffline";
import { useRouter } from "next/router";
import { Timeframe } from "shared/types/game";

export default function offline() {
  const router = useRouter();
  
  const path = router.query.timeframe as string;
  if (path === undefined) return;

  const timeframe = pathToTimeframe(path);
  if (timeframe === undefined) return <>404</>;
  
  return <GameOffline timeframe={timeframe}/>;
}

function pathToTimeframe(path: string): Timeframe | undefined {
  if (path === 'untimed') return "untimed";

  const parts = path.split('-');

  if (parts.length < 2) return undefined;

  const overallSec = parseInt(parts[0]);
  if (Number.isNaN(overallSec)) return undefined;

  const incrementSec = parseInt(parts[1]);
  if (Number.isNaN(incrementSec)) return undefined;

  return {overallSec: overallSec, incSec: incrementSec};
}