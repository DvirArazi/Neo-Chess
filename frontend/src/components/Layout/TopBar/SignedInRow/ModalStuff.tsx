import { Box, Divider, IconButton, Tooltip } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { THEME } from "frontend/src/pages/_app";
import { IconName } from "frontend/src/utils/types/iconName";

export function ModalTitle(props: { title: string }) {
  const { title } = props;

  return <Box sx={{
    fontWeight: `bold`,
    fontSize: `18px`,
    fontFamily: `robotoslab`,
  }}>{title}</Box>;
}

export function ModalSpacer() {
  return <>
    <Box sx={{ height: `20px` }} />
    <Divider variant="middle" />
    <Box sx={{ height: `20px` }} />
  </>;
}

export function ModalEmpty(props: { text: string }) {
  const { text } = props;

  return <Box sx={{ padding: `20px`, color: `gray` }}>
    {text}
  </Box>;
}

export function VXButtons(props: { onClick: (isAccepted: boolean) => void }) {
  const {onClick} = props;

  return <Box sx={{ display: `flex` }}>
    {getButton(true)}
    {getButton(false)}
  </Box>;

  function getButton(isAccepted: boolean) {
    const [iconName, color0, color1, hint, radii]:
      [IconName, string, string, string, string] = isAccepted ?
        ["approve", `#00e600`, `#00cc00`, 'Approve', `5px 0 0 5px`] :
        ["deny", `#ff3333`, `#e60000`, 'Deny', `0 5px 5px 0`];

    return <>
      <Tooltip
        title={hint}
        placement={"top"}
        arrow
      >
        <IconButton
          onClick={() => onClick(isAccepted)}
          sx={{
            borderRadius: radii,

            background: color0,
            ":hover": { background: color1 },
          }}
        >
          <Icon name={iconName} side={30} filter={THEME.negativeIcon} />
        </IconButton>
      </Tooltip>
    </>
  }
}