import { Box, Modal } from "@mui/material";
import Stateful from "frontend/src/utils/tools/stateful";

export default function ModalFrame(props: {
  isOpen: Stateful<boolean>,
  width?: number,
  keepMounted?: boolean,
  children: React.ReactNode,
}) {
  const { isOpen, children, width, keepMounted: keepMountedO } = props;
  const widthStr = width !== undefined ? `${width}px` : `350px`;
  const keepMounted = keepMountedO === undefined ? true : keepMountedO; 

  return (
    <Modal
      keepMounted={keepMounted}
      open={isOpen.value}
      onClose={() => { isOpen.set(false) }}
    >
      <Box
        onClick={() => { isOpen.set(false) }}
        sx={{
          position: `fixed`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `100%`,
          maxHeight: `100%`,
          outline: 0,
          display: `flex`,
          justifyContent: `center`,
          // margin: `10px`
        }}
      >
        <Box
          onClick={(e) => { e.stopPropagation() }}
          sx={{
            margin: `20px 30px`,
            width: widthStr,
            // background: `rgba(0, 0, 0)`,
            borderRadius: '15px',
            boxShadow: 24,
            textAlign: `center`,
            overflow: `auto`,
            // scrollbarWidth: `none`,
            // "::-webkit-scrollbar": {
            //   display: `none`,
            // }
          }}
        >
          <Box sx={{
            background: `white`,
            overflow: `auto`,
          }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}