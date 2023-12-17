import React from 'react';
import * as ReactDOM from 'react-dom';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { onDocumentReady } from '../../../local/windowLoadListener';
import ChangeTracker from 'change-tracker/src';
import RootNode from './types/RootNode';

class ReactBase {
  public onUiLoaded = new ChangeTracker();

  private _rootNode = null;

  constructor() {
    onDocumentReady(this.setupReact.bind(this));
  }

  setupReact() {
    this._rootNode = ReactDOM.render(
      <RootNode/>,
      document.getElementById('reactRoot'),
    );
  }
}

const reactBasePlugin = new CosmosisPlugin('reactBase', ReactBase);

export {
  ReactBase,
  reactBasePlugin,
}
