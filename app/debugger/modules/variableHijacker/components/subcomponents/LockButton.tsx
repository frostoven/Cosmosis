import { Button, Icon } from 'semantic-ui-react';
import React from 'react';

const LOCK_STYLE = {
  backgroundColor: '#595e60',
  width: 53,
  margin: 0,
};

interface Props {
  locked?: boolean,
  onClick?: Function,
  style?: Object,
  disabled?: boolean,
}

export default function LockButton(props: Props) {
  const lockStyle = { ...LOCK_STYLE, ...(props.style || {}) };
  props.locked && (lockStyle.backgroundColor = '#485563');
  const onClick = props.onClick || null;
  const disabled = !!props.disabled;
  return (
    // @ts-ignore
    <Button positive={false} style={lockStyle} onClick={onClick} disabled={disabled}>
      <Icon name={props.locked ? 'lock' : 'unlock'}/>
    </Button>
  )
}
