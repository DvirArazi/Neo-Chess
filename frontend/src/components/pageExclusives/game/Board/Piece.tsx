import { Box, createTheme } from "@mui/material";
import { PieceData } from "shared/types/piece";
import Draggable, { ControlPosition } from "react-draggable";
import { Point } from "shared/types/game";
import { useEffect, useRef } from "react";
import Icon from "frontend/src/components/Icon";
import Stateful from "frontend/src/utils/tools/stateful";
import { pieceDataToIconName } from "shared/tools/piece";
import { BOARD_SIDE, SQUARE_SIZE } from "shared/tools/boardLayout";

export default function Piece(props: {
  data: PieceData,
  index: number,
  isEnabled: boolean,
  slide: boolean,
  isFlipped: boolean,
  onStart: () => void,
  onEnd: () => void,
}) {
  const { data, isEnabled, index, slide, isFlipped, onStart, onEnd } = props;

  const mouseDownTime = new Stateful(0);
  const draggableRef = useRef<HTMLDivElement>(null);
  // const boxRef = useRef<HTMLDivElement>(null);
  const flipTurns = new Stateful(0);

  useEffect(()=>{
    if (
      isFlipped && flipTurns.value * 2 % 2 === 0 ||
      !isFlipped && flipTurns.value * 2 % 2 !== 0
    ) {
      flipTurns.set((v)=>v+0.5)
    }
  }, [isFlipped]);
  // useEffect(()=>{flipTurns.current += 1}, [isFlipped]);
  // if (boxRef.current !== null) {
  //   useEffect(()=>{
  //     const ref = boxRef.current!;
  //     ref.ontransition = () => {
  //       if (isFlipped) console.log('small step');
  //     }
  //   }, []);
  // // }

  const fracPosition: Point = {
    x: index % BOARD_SIDE * SQUARE_SIZE,
    y: Math.floor(index / BOARD_SIDE) * SQUARE_SIZE,
  };

  return (
    <Draggable nodeRef={draggableRef}
      disabled={!isEnabled}
      position={{ x: 0, y: 0 }}
      onStart={(e) => {
        e.stopPropagation();
        mouseDownTime.set(new Date().getTime());
        onStart();
      }}
      onStop={(e) => {
        e.stopPropagation();
        const timePassed = new Date().getTime() - mouseDownTime.value;
        if (timePassed < 300) return;

        onEnd();
      }}
    >
      <Box ref={draggableRef}
        sx={{
          position: `absolute`,
          left: `${fracPosition.x}%`,
          top: `${fracPosition.y}%`,
          width: `${SQUARE_SIZE}%`,
          height: `${SQUARE_SIZE}%`,
          zIndex: `10`,
          ":hover": {
            cursor: `${isEnabled ? `pointer` : `default`}`,
          },
          ":active": {
            zIndex: `20`,
          },
          transition: `${slide ? `left 0.3s, top 0.3s` : `none`}`,
        }}
      >
        <Box //ref={boxRef}
          sx={{
            position: `absolute`,
            width: `100%`,
            height: `100%`,
            // transform: isFlipped ? `rotate(0.5turn)` : `rotate(0turn)`,
            transform: `rotate(${flipTurns.value}turn)`,
            transition: `transform 0.3s`
          }}
          // onTransitionEnd={(e)=>{
          //   console.log('again');
          // }}
        >
        <Icon path={`chess/${pieceDataToIconName(data)}`} />
      </Box>
    </Box>
    </Draggable >
  );
}