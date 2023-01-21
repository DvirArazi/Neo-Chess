import MenuModal from "frontend/src/components/MenuModal";
import Stateful from "frontend/src/utils/tools/stateful";

export default function MenuOffline(props: {
  isOpen: Stateful<Boolean>
}) {

  return <MenuModal/>;
}