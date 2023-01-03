import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";
import Stateful from "../utils/stateful";


export default function Toggle(props: {
  isOn: Stateful<boolean>,
  children: React.ReactNode,
  isOnDisabled?: boolean
}) {
  const { isOn, children } = props;
  if (children == undefined) {
    throw new Error('"children" is undefined');
  }
  const isOnDisabled = props.isOnDisabled ?? false;

  if (isOn.value && isOnDisabled) {
    isOn.set(false);
  }

  return (<ToggleButtonGroup
    exclusive={true}
    value={isOn.value}
    onChange={
      (
        _: React.MouseEvent<HTMLElement>,
        newIsOpen: boolean | null
      ) => {
        if (newIsOpen != null) {
          isOn.set(newIsOpen);
        }
      }
    }
  >
    <ToggleButton disabled={isOnDisabled} value={true}>{children[0]}</ToggleButton>
    <ToggleButton value={false}>{children[1]}</ToggleButton>
  </ToggleButtonGroup>);
}