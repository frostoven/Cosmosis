import _ from 'lodash';
import React from 'react';
import { TreeObject } from './interfaces/TreeObject';
import { guessTypeInfo } from '../../../debuggerUtils';
import AutoValueEditor from './variableControl/AutoValueEditor';
import PreventRender from '../../../components/PreventRender';

export default class ObjectScanner extends React.Component<any, any>{
  // If true, the whole object tree is (shallowly) rebuild on rerender.
  static rebuildTreeAggressively = false;

  state = {};

  private _objectTreeCache: Array<any>;
  // If the tree is currently rebuilding, this is true. Else false.
  private _objectTreeCacheBuilding: boolean;

  constructor(props) {
    super(props);
    this._objectTreeCache = [];
    this._objectTreeCacheBuilding = false;
  }

  componentDidMount() {
    console.log('-> ObjectScanner mounted.');
    this.buildObjectTree(true);
  }

  componentWillUnmount() {
    console.log('-> ObjectScanner unmounting.');
  }

  buildObjectTree(rerenderWhenDone = false) {
    if (this._objectTreeCacheBuilding) {
      return;
    }

    this._objectTreeCacheBuilding = true;
    const instance = this.props.parent;
    if (!instance) {
      if (rerenderWhenDone) {
        this.setState({ forceRerender: Math.random() });
      }
      return;
    }

    const publicVars: Array<TreeObject> = [];
    const privateVars: Array<TreeObject> = [];
    const accessors: Array<TreeObject> = [];
    // const methods: Array<any> = [];

    let varCount = 0;
    _.each(instance, (value, key) => {
      varCount++;
      if (key[0] === '_') {
        privateVars.push({ key, value, isPrivate: true });
      }
      else {
        publicVars.push({ key, value, isPrivate: false });
      }
    });

    const descriptors = Object.entries(
      Object.getOwnPropertyDescriptors(instance.__proto__),
    );

    const getters = descriptors.filter(([key, descriptor]) => {
      return typeof descriptor.get === 'function';
    });

    _.each(getters, (getter) => {
      const key = getter[0];
      if (key === '__proto__') {
        // While cute to display, this breaks seriously hard if hijacked, and
        // it seems silly to specially code support to make it not clickable.
        return;
      }
      accessors.push({
        key, value: instance[key], isPrivate: key[0] === '_', isAccessor: true,
      });
    });

    if (!varCount) {
      privateVars.push({ key: '[ no contents ]', value: {}, isPrivate: false });
    }

    this._objectTreeCache = publicVars.concat(privateVars).concat(accessors);
    this._objectTreeCacheBuilding = false;

    if (rerenderWhenDone) {
      this.setState({ forceRerender: Math.random() });
    }
  }

  renderTree() {
    const list: Array<any> = [];
    const objectTreeCache = this._objectTreeCache;
    for (let i = 0, len = objectTreeCache.length; i < len; i++) {
      const treeObject: TreeObject = objectTreeCache[i];
      let type = typeof treeObject.value;
      // Note: typeInfo does not mean 'type'. It's more like a human-readable
      // hint, and takes some liberties such as calling null 'null' instead of
      // 'object'.
      const typeInfo = guessTypeInfo(treeObject.value);
      if (typeInfo.friendlyName === 'function') {
        // Functions may or may not show up here depending on whether or not
        // they're defined as methods or properties.
        continue;
      }

      const componentKey = this.props.name + '-item-' + i;
      list.push(
        <AutoValueEditor
          key={componentKey}
          type={type}
          typeInfo={typeInfo}
          treeObject={treeObject}
          name={this.props.name}
          parent={this.props.parent}
        />
      );
    }
    return list;
  }

  render() {
    if (!this._objectTreeCache.length) {
      return <div>Loading...</div>;
    }

    if (ObjectScanner.rebuildTreeAggressively) {
      this.buildObjectTree();
    }

    return (
      <PreventRender renderWhenChanging={this.props.name}>
        {this.renderTree()}
      </PreventRender>
    );
  }
}
