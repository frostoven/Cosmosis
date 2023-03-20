import React from 'react';

const ICON_STYLE = {
  marginLeft: -4,
  marginBottom: -4,
  marginRight: 4,
};

const iconPath = '/css/debuggerIcons';

const icon = {
  bigint: `${iconPath}/number.png`,
  boolean: `${iconPath}/boolean.png`,
  null: `${iconPath}/null.png`,
  number: `${iconPath}/number.png`,
  object: `${iconPath}/object.png`,
  string: `${iconPath}/string.png`,
  undefined: `${iconPath}/undefined.png`,
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
    let iconUri = icon[this.props.name];
    if (!iconUri) {
      iconUri = icon['object'];
    }

    return (
      <img style={ICON_STYLE} alt='' src={iconUri} />
    );
  }
}
