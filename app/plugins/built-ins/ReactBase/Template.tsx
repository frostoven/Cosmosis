import React from 'react';

const CONTAINER_STYLE = {};

interface Props {
  // key: type,
}

interface State {
  // key: type,
}

class Template extends React.Component<Props, State> {
  state = {
    // key: value,
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <div style={CONTAINER_STYLE}>
        ( ꒪ ▵꒪)
      </div>
    );
  }
}

export {
  Template,
};
