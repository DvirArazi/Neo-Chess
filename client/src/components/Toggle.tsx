import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";
import Stateful from "../Utils/types";


export default function Toggle(props: {
  isOpen: Stateful<boolean>,
  children: React.ReactNode
}) {
  const { isOpen: isOpen, children } = props;

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
    <ToggleButton value={true}>{children[0]}</ToggleButton>
    <ToggleButton value={false}>{children[1]}</ToggleButton>
  </ToggleButtonGroup>);
}