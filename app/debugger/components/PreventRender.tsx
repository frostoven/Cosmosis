import React from 'react';

interface Props {
  children: any,
  renderWhenChanging?: any,
  // If incremented, allows a rerender even if renderWhenChanging hasn't
  // updated.
  tick?: number,
}

export default class PreventRender extends React.Component<Props> {
  private _propCache: any;
  private renderCount: number;

  constructor(props) {
    super(props);
    this.renderCount = props.tick || 0;
  }

  shouldComponentUpdate() {
    if (typeof this.props.renderWhenChanging === 'undefined') {
      return false;
    }

    if (this.props.tick !== this.renderCount) {
      this.renderCount = this.props.tick || 0;
      return true;
    }

    const newPropCache = JSON.stringify(this.props.renderWhenChanging);
    if (this._propCache === newPropCache) {
      return false;
    }
    this._propCache = newPropCache;
    return true;
  }

  render() {
    return this.props.children;
  }
}
