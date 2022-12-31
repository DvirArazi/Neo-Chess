import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";
import Stateful from "../utils/stateful";


export default function Toggle(props: {
  isOpen: Stateful<boolean>,
  children: React.ReactNode,
  isLeftDisabled?: boolean
}) {
  const { isOpen, children} = props;

  const isLeftDisabled = props.isLeftDisabled ?? false;

  return (<ToggleButtonGroup
    exclusive={true}
    value={isOpen.value}
    onChange={
      (
        _: React.MouseEvent<HTMLElement>,
        newIsOpen: boolean | null
      ) => {
        if (newIsOpen != null) {
          isOpen.set(newIsOpen);
        }
      }
    }
  >
    <ToggleButton disabled={isLeftDisabled} value={true}>{children[0]}</ToggleButton>
    <ToggleButton value={false}>{children[1]}</ToggleButton>
  </ToggleButtonGroup>);
}