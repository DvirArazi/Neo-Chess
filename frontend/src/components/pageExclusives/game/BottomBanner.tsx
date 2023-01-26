import { Box, IconButton } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { THEME } from "frontend/src/pages/_app";
export default function ButtonsBanner(props: {
  canStepBack: boolean,
  canStepForward: boolean,
  isPaused: boolean,
  isWide: boolean,
  onMenuClick: () => void,
  onPauseClick: () => void,
  onBackClick: () => void,
  onForwardClick: () => void,
}) {
  const {
    onMenuClick,
    onBackClick,
    isPaused,
    isWide,
    onForwardClick,
    onPauseClick,
    canStepBack,
    canStepForward
  } = props;

  return <Box sx={{
    display: `flex`,
    flexDirection: `row`,
    justifyContent: `space-around`,
  }}>
    <IconButton onClick={onMenuClick}>
      <Icon
        path="menu"
        side={40}
        color={THEME.icon}
      />
    </IconButton>

    <IconButton onClick={onPauseClick}>
      <Icon
        path={isPaused ? "play" : "pause"}
        side={40}
        color='gray'
      />
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