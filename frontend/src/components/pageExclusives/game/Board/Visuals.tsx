import { Box } from "@mui/material";
import { SQUARE_SIZE } from "shared/tools/boardLayout";
import { Point } from "shared/types/game";

const DIA = 0.4;

export function Dot(props: { position: Point, onPressed: (globalPos: Point) => void }) {
  const { position, onPressed } = props;

  return (
    <Box
      onMouseDown={(e) => {
        e.stopPropagation();
        onPressed({ x: e.clientX, y: e.clientY });
      }}
      sx={{
        position: `absolute`,
        left: `${position.x * SQUARE_SIZE}%`,
        top: `${position.y * SQUARE_SIZE}%`,
        width: `${SQUARE_SIZE}%`,
        height: `${SQUARE_SIZE}%`,
        zIndex: 20,
        ":hover": {
          cursor: `pointer`,
        },
      }}
    >
      <Box sx={{
        position: `absolute`,
        left: `${(1 - DIA) / 2 * 100}%`,
        top: `${(1 - DIA) / 2 * 100}%`,
        width: `${DIA * 100}%`,
        height: `${DIA * 100}%`,
        borderRadius: `50%`,
        background: `rgb(33, 150, 243, 0.6)`,
        ":hover": {
          cursor: `pointer`,
        },
      }} />
    </Box>
  );
}

const CHOSEN_EXTRA = 0.8;

export function ChosenHighlight(props: { position: Point }) {
  const { position } = props;

  return (
    <Box
      sx={{
        position: `absolute`,
        left: `${position.x * SQUARE_SIZE - CHOSEN_EXTRA}%`,
        top: `${position.y * SQUARE_SIZE - CHOSEN_EXTRA}%`,
        width: `${SQUARE_SIZE + CHOSEN_EXTRA * 2}%`,
        height: `${SQUARE_SIZE + CHOSEN_EXTRA * 2}%`,
        borderRadius: `50%`,
        background: `rgb(255, 191, 0, 0.3)`,
      }}
    />
  );
}

const PREV_EXTRA = -0.0;

export function PreviousHighlight(props: { position: Point }) {
  const { position } = props;

  return (
    <Box
      sx={{
        position: `absolute`,
        left: `${position.x * SQUARE_SIZE - PREV_EXTRA}%`,
        top: `${position.y * SQUARE_SIZE - PREV_EXTRA}%`,
        width: `${SQUARE_SIZE + PREV_EXTRA * 2}%`,
        height: `${SQUARE_SIZE + PREV_EXTRA * 2}%`,
        borderRadius: `35%`,
        background: `rgb(255, 255, 50, 0.3)`,
        transform: `translate(0.0px, 0.0px)`
      }}
    />
  );
}