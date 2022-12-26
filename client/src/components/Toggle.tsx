import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";

export default function Toggle(props: {
  isOpen: boolean|null,
  setIsOpen: (value: React.SetStateAction<boolean|null>) => void,
  children: React.ReactNode
}) {
  const {isOpen, setIsOpen, children} = props;
  
  return (<ToggleButtonGroup
    exclusive={true}
    
    value={isOpen}
    onChange={
      (
        _: React.MouseEvent<HTMLElement>,
        newIsOpen: boolean|null
      ) => {
        if (newIsOpen != null) {
          setIsOpen(newIsOpen);
        }
      }
    }
  >
    <ToggleButton value={true}>{children[0]}</ToggleButton>
    <ToggleButton value={false}>{children[1]}</ToggleButton>
  </ToggleButtonGroup>);
}