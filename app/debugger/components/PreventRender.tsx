import React from 'react';

interface Props {
  children: any,
  renderWhenChanging: any,
}

export default class PreventRender extends React.Component<Props> {
  private _propCache: any;
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate() {
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
