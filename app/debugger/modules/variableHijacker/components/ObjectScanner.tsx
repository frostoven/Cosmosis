import _ from 'lodash';
import React from 'react';
import { CosmDbgRootUtils } from '../../../components/interfaces/CosmDbgRootUtils';
import { TreeObject } from './interfaces/TreeObject';
import { gameRuntime } from '../../../../plugins/gameRuntime';
import ChangeTracker from 'change-tracker/src';
import { guessTypeInfo } from '../../../debuggerUtils';

interface RootUtils extends CosmDbgRootUtils {
  rootState: {},
  name: string,
}

export default class ObjectScanner extends React.Component<any, any>{
  state = { objectTree: [] };

  componentDidMount() {
    console.log('-> ObjectScanner mounted.');
    const plugin = gameRuntime.tracked[this.props.name];

    if (!plugin || !plugin.getOnce) {
      this.setState({
        objectTree: [{ key: '[object cannot be probed]', value: {}, private: false }],
      });
      return;
    }

    plugin.getOnce((instance) => {
      const publicVars: Array<TreeObject> = [];
      const privateVars: Array<TreeObject> = [];
      const methods: Array<any> = [];

      let varCount = 0;
      _.each(instance, (value, key) => {
        varCount++;
        if (key[0] === '_') {
          privateVars.push({ key, value, private: true });
        }
        else {
          publicVars.push({ key, value, private: false });
        }
      });

      if (!varCount) {
        privateVars.push({ key: '[no contents]', value: {}, private: false });
      }

      this.setState({
        objectTree: publicVars.concat(privateVars),
      });
    });
  }

  componentWillUnmount() {
    console.log('-> ObjectScanner unmounting.');
  }

  genTree() {
    const list: Array<any> = [];
    const objectTree = this.state.objectTree;
    for (let i = 0, len = objectTree.length; i < len; i++) {
      const { key, value }: TreeObject = objectTree[i];
      let type = typeof value;
      const typeInfo = guessTypeInfo(value);

      let style = {};
      let isPrivate = key[0] === '_';
      if (isPrivate) {
        style = { fontStyle: 'italic' };
      }

      if (typeInfo.stringCompatible) {
        list.push(
          <div key={this.props.name + '-item-' + i} style={style}>
            [{type}] {key} {value}
          </div>
        );
      }
      else {
        list.push(
          <div key={this.props.name + '-item-' + i} style={style}>
            [{type}] {key} [{typeInfo.friendlyName}]
          </div>
        );
      }
    }
    return list;
  }

  render() {
    if (!this.state.objectTree.length) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        {this.genTree()}
      </div>
    );
  }
}
