import { Box } from "@mui/material";
import { SQUARE_SIZE } from "frontend/src/components/pageExclusives/game/Board";
import { Point } from "shared/types/gameTypes";

const dia = 0.4;

export function Dot(props: { position: Point, onPressed: () => void }) {
  const { position, onPressed } = props;

  return (
    <Box 
      onMouseDown={(e)=>{
        e.stopPropagation();
        onPressed();
      }}
      sx={{
        position: `absolute`,
        left: `${position.x * SQUARE_SIZE}%`,
        top: `${position.y * SQUARE_SIZE}%`,
        width: `${SQUARE_SIZE}%`,
        height: `${SQUARE_SIZE}%`,
        ":hover": {
          cursor: `pointer`,
        },
      }}
    >
      <Box sx={{
        position: `absolute`,
        left: `${(1 - dia) / 2 * 100}%`,
        top: `${(1 - dia) / 2 * 100}%`,
        width: `${dia * 100}%`,
        height: `${dia * 100}%`,
        borderRadius: `50%`,
        background: `rgb(33, 150, 243, 0.6)`,
        zIndex: 20,
        ":hover": {
          cursor: `pointer`,
        },
      }} />
    </Box>
  );
}

const extra = 0.8;

export function Highlight(props: { position: Point }) {
  const { position } = props;

  return (
    <Box
      sx={{
        position: `absolute`,
        left: `${position.x * SQUARE_SIZE - extra}%`,
        top: `${position.y * SQUARE_SIZE - extra}%`,
        width: `${SQUARE_SIZE + extra * 2}%`,
        height: `${SQUARE_SIZE + extra * 2}%`,
        borderRadius: `50%`,
        background: `rgb(255, 191, 0, 0.3)`,
      }}
    />
  );
}