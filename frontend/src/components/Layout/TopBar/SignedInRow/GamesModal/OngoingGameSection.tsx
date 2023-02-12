import GameThumbnail from "frontend/src/components/GameThumbnail";
import { ModalEmpty, ModalTitle } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import { GameTd } from "shared/types/general";

export default function OngoingGamesSection(props: { ongoingGamesTd: GameTd[] }) {
  const { ongoingGamesTd } = props;

  return <>
    <ModalTitle title={'Ongoing Games'} />
    {getOngoingGames()}
  </>

  function getOngoingGames() {
    if (ongoingGamesTd.length === 0) {
      return <ModalEmpty text={'You don\'t have any ongoing games at the moment'} />;
    }

    return ongoingGamesTd.map(td => <GameThumbnail key={td.path} data={td} />);
  }
}