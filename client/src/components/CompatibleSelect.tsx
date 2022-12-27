import { NativeSelect, NativeSelectProps, Select, SelectProps, SxProps } from '@mui/material';
import { isMobile } from 'react-device-detect';

export default function CompatibleSelect(props: SelectProps & NativeSelectProps) {

  return (
    isMobile ? <NativeSelect {...props} /> : <Select {...props} />
  );
}