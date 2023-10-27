import React from 'react';
import scrollIntoView from './scrollIntoView';

/**
 * A React component that automatically scrolls the component into view on
 * render.
 */
export default class ScrollIntoView extends React.Component<any, any> {
  private myRef: React.RefObject<any>;

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  scrollIntoView = () => {
    if (!this.myRef.current) {
      return;
    }
    this.myRef.current.scrollIntoView();
  };

  render() {
    this.scrollIntoView();


    return (
      <div ref={scrollIntoView} onClick={this.props.onClick}>
        {this.props.children}
      </div>
    );
  }
}
