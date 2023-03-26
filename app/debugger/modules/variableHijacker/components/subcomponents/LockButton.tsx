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
}

export default function LockButton(props: Props) {
  const lockStyle = { ...LOCK_STYLE, ...(props.style || {}) };
  props.locked && (lockStyle.backgroundColor = '#485563');
  return (
    // @ts-ignore
    <Button positive={false} style={lockStyle} onClick={props.onClick || null}>
      <Icon name={props.locked ? 'lock' : 'unlock'}/>
    </Button>
  )
}
