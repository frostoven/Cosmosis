import React from 'react';

interface Props {
  min?: number,
  max?: number,
}

export default class NumberSliderRange extends React.Component<Props> {
  render() {
    return (
      <div>
        Min: [] | Max: []
      </div>
    );
  }
}
