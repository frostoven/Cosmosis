import React from 'react';
import { icon } from './configs/theme';

const ICON_STYLE = {
  marginLeft: -12,
  marginBottom: -12,
  marginRight: 4,
  marginTop: -8,
  padding: 8,
};

// Further explanation:
// https://stackoverflow.com/questions/53662208/types-from-both-keys-and-values-of-object-in-typescript
type Keys = keyof typeof icon;

interface Props {
  name: Keys | string,
  onClick?: (event) => any,
  style?: any,
  className?: any,
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
      <img className={this.props.className || ''} style={{
        ...ICON_STYLE, ...(this.props.style || {})
      }} alt='' src={iconUri} onClick={this.props.onClick}/>
    );
  }
}
