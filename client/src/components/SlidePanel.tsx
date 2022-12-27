import { Box } from "@mui/material";
import useEnhancedEffect from "@mui/material/utils/useEnhancedEffect";
import Stateful from "../Utils/types";
import React, { useEffect, useRef } from 'react'

export default function SlidePanel(props: { isRanged: boolean }) {
  const { isRanged: isLeft } = props;

  const parentWidth = new Stateful(0);
  const parentRef = useRef<HTMLDivElement>(null);

  const box0Height = new Stateful(0);
  const box0ref = useRef<HTMLDivElement>(null);

  const box1Height = new Stateful(0);
  const box1ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    parentWidth.set(parentRef.current.clientWidth);
    box0Height.set(box0ref.current.clientHeight);
    box1Height.set(box1ref.current.clientHeight);

    console.log(`${parentWidth.value}, ${box0Height.value}, ${box1Height.value}`)
  });

  return (
    <Box ref={parentRef}
      sx={{
        position: `relative`,
        overflow: `hidden`,
        height: `${isLeft? box0Height.value : box1Height.value}px`,
        transition: `height 0.2s ease-out`,
      }}
    >
      <Box
        sx={{
          position: `absolute`,
          transform: `translateX(${isLeft?`0`:`-50%`})`,
          // height: `${isLeft? box0Height.value : box1Height.value}px`,
          transition: `transform 0.2s ease-out`,
          display: `flex`,
          flexDirection: `row`,
        }}
      >
        <Box
          sx={{
            width: `${parentWidth.value}px`,

            background: `red`,
          }}
        >
          <Box ref={box0ref}>
            Lorem Ipsum is
          </Box>
        </Box>

        <Box
          sx={{
            width: `${parentWidth.value}px`,
            background: `green`,
          }}
        >
          <Box ref={box1ref}>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32. The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.
          </Box>
        </Box>

      </Box>
    </Box>
  );
}