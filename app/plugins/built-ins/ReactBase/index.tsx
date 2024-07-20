import React from 'react';
import * as ReactDOM from 'react-dom';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import {
  logBootTitleAndInfo,
  onDocumentReady,
} from '../../../local/windowLoadListener';
import RootNode from './types/RootNode';
import PluginLoader from '../../types/PluginLoader';
import { RegisterMenuSignature } from './types/compositionSignatures';

class ReactBase {
  private _rootNode: RootNode | null = null;

  constructor() {
    logBootTitleAndInfo('Driver', 'Human Interface Generics', PluginLoader.bootLogIndex);
    onDocumentReady(this.setupReact.bind(this));
  }

  registerMenu = (options: RegisterMenuSignature) => {
    if (!this._rootNode) {
      console.warn('Cannot open menu [name] - ReactBase still loading.');
      return;
    }

    this._rootNode.registerMenu(options);
  };

  // noinspection JSUnusedGlobalSymbols - API function.
  openMenu = (name: string) => {
    this._rootNode?.openMenu(name);
  };

  // noinspection JSUnusedGlobalSymbols - API function.
  closeMenu = (name: string) => {
    this._rootNode?.closeMenu(name);
  };

  toggleMenu = (name: string) => {
    this._rootNode?.toggleMenu(name);
  };

  // noinspection JSUnusedGlobalSymbols - API function.
  getRegisteredMenuNames = () => {
    return this._rootNode?.getRegisteredMenuNames();
  };

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
};
