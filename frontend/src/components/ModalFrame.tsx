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
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `100%`,
          maxHeight: `100%`,
          outline: 0,
          display: `flex`,
          justifyContent: `center`,
        }}
      >
        <Box
          onClick={(e) => { e.stopPropagation() }}
          sx={{
            margin: `30px`,
            width: widthStr,
            bgcolor: 'background.paper',
            borderRadius: '15px',
            boxShadow: 24,
            textAlign: `center`,
            overflow: `scroll`,
          }}
        >
          {children}
        </Box>
      </Box>
    </Modal>
  );
}