import React from 'react';

interface Props {
}

export default class RootNode extends React.Component<Props> {
  constructor(props: Props | Readonly<Props>) {
    super(props);
  }

  render() {
    return (
      <div>
      </div>
    );
  }
}
