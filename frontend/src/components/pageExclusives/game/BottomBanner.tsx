import { Box, IconButton } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { THEME } from "frontend/src/pages/_app";

export default function BottomBanner(props: {
  canStepBack: boolean,
  canStepForward: boolean,
  onMenuClick: () => void,
  onBackClick: () => void,
  onForwardClick: ()=> void,
}) {
  const {
    onMenuClick,
    onBackClick,
    onForwardClick,
    canStepBack,
    canStepForward
  } = props;

  return <Box sx={{
    display: `flex`,
    flexDirection: `row`,
    justifyContent: `space-around`,
  }}>
    <IconButton onClick={onMenuClick}>
      <Icon path="menu" side={40} color={THEME.icon} />
    </IconButton>
    <IconButton
      disabled={!canStepBack}
      onClick={onBackClick}
    >
      <Icon
        path="navigate_left"
        side={40}
        color={canStepBack ? THEME.icon : THEME.iconDisabled}
      />
    </IconButton>
    <IconButton
      disabled={!canStepForward}
      onClick={onForwardClick}
    >
      <Icon
        path="navigate_right"
        side={40}
        color={canStepForward ? THEME.icon : THEME.iconDisabled}
      />
    </IconButton>
  </Box>;
}