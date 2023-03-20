import React from 'react';
import { icon } from './configs/theme';

const ICON_STYLE = {
  marginLeft: -4,
  marginBottom: -4,
  marginRight: 12,
};

// Further explanation:
// https://stackoverflow.com/questions/53662208/types-from-both-keys-and-values-of-object-in-typescript
type Keys = keyof typeof icon;

interface Props {
  name: Keys | string,
}

export default class TypeImageIcon extends React.Component<Props>{
  constructor(props) {
    super(props);
  }

  render() {
    let iconUri = icon[this.props.name]?.img;
    if (!iconUri) {
      iconUri = icon['Object'].img;
    }

    return (
      <img style={ICON_STYLE} alt='' src={iconUri} />
    );
  }
}
