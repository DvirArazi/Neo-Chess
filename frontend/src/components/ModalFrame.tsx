import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Modal, SxProps, Theme, Typography } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import Stateful from "frontend/src/utils/tools/stateful";
import { getOppositeColor } from "shared/tools/piece";
import { DrawReason, GameStatus, GameStatusCatagory, WinReason } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function ModalFrame(props: {
  isOpen: Stateful<boolean>,
  width?: number,
  children: React.ReactNode,
}) {
  const { isOpen, children, width } = props;
  const widthStr = props.width !== undefined ? `${props.width}px` : `350px`; 

  return (
    <Modal
      open={isOpen.value}
      onClose={() => { isOpen.set(false) }}
    >
      <Box
        onClick={() => { isOpen.set(false) }}
        sx={{
          // overflow: `hidden`,
          position: `fixed`,
          // top: `0`,
          // left: `0`,
          // bottom: `0`,
          // right: `0`,
          // position: 'absolute',
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
            bgcolor: 'background.paper',
            borderRadius: '15px',
            boxShadow: 24,
            textAlign: `center`,
            // overflow: `scroll`,
            overflow: `auto`
          }}
        >
          {children}
        </Box>
      </Box>
    </Modal>
  );
}