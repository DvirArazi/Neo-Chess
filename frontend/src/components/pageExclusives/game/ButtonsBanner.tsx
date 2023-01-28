import { Box, IconButton } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { THEME } from "frontend/src/pages/_app";
export default function ButtonsBanner(props: {
  canStepBack: boolean,
  canStepForward: boolean,
  isPaused: boolean,
  isUntimed: boolean,
  onMenuClick: () => void,
  onPauseClick: () => void,
  onBackClick: () => void,
  onForwardClick: () => void,
}) {
  const {
    onMenuClick,
    onBackClick,
    isPaused,
    isUntimed,
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
        name="menu"
        side={40}
        filter={THEME.icon}
      />
    </IconButton>

    {
      isUntimed ? <></> :
      <IconButton onClick={onPauseClick}>
        <Box sx={{ padding: `5px` }}>
          <Icon
            name={isPaused ? "play" : "pause"}
            side={30}
            filter={THEME.icon}
          />
        </Box>
      </IconButton>
    }

    <IconButton
      disabled={!canStepBack}
      onClick={onBackClick}
    >
      <Icon
        name="navigateLeft"
        side={40}
        filter={canStepBack ? THEME.icon : THEME.iconDisabled}
      />
    </IconButton>

    <IconButton
      disabled={!canStepForward}
      onClick={onForwardClick}
    >
      <Icon
        name="navigateRight"
        side={40}
        filter={canStepForward ? THEME.icon : THEME.iconDisabled}
      />
    </IconButton>

  </Box>;
}