import _ from 'lodash';
import React from 'react';
import { builtInPluginsEnabled } from '../../../../plugins/pluginsEnabled';
import { pluginLoader } from '../../../../plugins';
import { Accordion, Icon, List } from 'semantic-ui-react';
import { CosmDbgRootUtils } from '../../../components/interfaces/CosmDbgRootUtils';
import ObjectScanner from './ObjectScanner';
import { gameRuntime } from '../../../../plugins/gameRuntime';

const ROTATION_STYLE_FIX = {
  paddingRight: 0,
  verticalAlign: 'middle',
};

let _hourglassLen = builtInPluginsEnabled.length;
function getHourglass(_hourglassIndex) {
  if (_hourglassIndex < _hourglassLen * 0.3) {
    return 'hourglass start';
  }
  else if (_hourglassIndex < _hourglassLen * 0.6) {
    return 'hourglass half';
  }
  else if (_hourglassIndex < _hourglassLen * 0.99) {
    return 'hourglass end';
  }
}

interface RootUtils extends CosmDbgRootUtils {
  rootState: {
    pluginInterrogatorActiveSections: Array<number>,
  }
}

export default class PluginInterrogator extends React.Component<{ rootUtils: RootUtils }> {
  private loadCount: number;
  private readonly pluginInfo: { [key: string]: any };

  state = { allPluginsLoaded: false };

  constructor(props) {
    super(props);

    this.loadCount = 0;
    this.pluginInfo = {};
  }

  componentDidMount() {
    this.discoverPlugins();

    // pluginLoader.onLoaded.cachedValue
    pluginLoader.onLoaded.getOnce(() => {
      this.setState({ allPluginsLoaded: true });
      this.setState({ forceRerender: Math.random() });
    });

    pluginLoader.onProgress.getEveryChange(({ name, loaded, shoved }) => {
      const entry = this.pluginInfo[name];
      entry.name = name;
      entry.loaded = loaded;
      entry.shoved = shoved;
      if (loaded) {
        this.loadCount++;
      }
      this.setState({ forceRerender: Math.random() });
    });
  }

  discoverPlugins = () => {
    for (let i = 0, len = builtInPluginsEnabled.length; i < len; i++) {
      const entry = builtInPluginsEnabled[i];
      this.pluginInfo[entry.name] = {
        ...entry,
        loaded: false,
        shoved: false,
      };
    }
  };

  onClickSectionTitle = (event, titleProps) => {
    const index: number = titleProps.index;

    const rootState = this.props.rootUtils.rootState;
    const active = rootState.pluginInterrogatorActiveSections || [];
    const persistentIndex = active.indexOf(index);
    const isActive = persistentIndex !== -1;
    if (isActive) {
      active.splice(persistentIndex, 1);
    }
    else {
      active.push(index);
    }
    this.props.rootUtils.setPersistentState({
      pluginInterrogatorActiveSections: [ ...active ],
    });
  };

  // Used while the application boots.
  genLoadingList = () => {
    const list: any = [
      // @ts-ignore - fucking nonsensical garbage errors.
      <List key={'loading-list-progress'}>
        Progress: <Icon name={getHourglass(this.loadCount)} />
      </List>
    ];
    _.each(this.pluginInfo, (entry, name) => {
      const loaded = entry.loaded;
      let icon: string = entry.loaded ? 'check' : 'circle notch';
      entry.shoved && (icon = 'sync');

      list.push(
        // @ts-ignore
        <List key={name + '-loading-list'}>
          <List.Item>
            <Icon
              style={ROTATION_STYLE_FIX}
              loading={!loaded}
              // @ts-ignore
              name={icon}/>
            &nbsp;
            {name}
          </List.Item>
        </List>
      );
    });

    return list;
  };

  // Used after the application has finished booting.
  genPluginList = () => {
    const list: any = [];
    let accordionIndex = 0;
    _.each(this.pluginInfo, (entry, name) => {
      accordionIndex++;
      const loaded = entry.loaded;
      let icon: string = entry.loaded ? 'check' : 'circle notch';
      entry.shoved && (icon = 'sync');

      const active = this.props.rootUtils.rootState.pluginInterrogatorActiveSections || [];
      const isActive = active.includes(accordionIndex);
      const parent = gameRuntime.tracked[name]?.cachedValue;
      const isShipModule = typeof parent?.createPart === 'function';
      list.push(
        [
          <Accordion.Title
            key={`interrogated-title-${name}`}
            index={accordionIndex}
            active={isActive}
            onClick={this.onClickSectionTitle}
            style={{ opacity: isShipModule ? 0.5 : 1 }}
          >
            <Icon name="dropdown"/>
            {name}
          </Accordion.Title>,
          <Accordion.Content key={`interrogated-item-${name}`} active={isActive}>
            {isActive && <ObjectScanner name={name} parent={parent}/>}
          </Accordion.Content>
        ]
      );
    });

    return ([
      <div key={'interrogated-plugin-description'}>
        <Icon name='code'/> gameRuntime.tracked
      </div>,
      <Accordion.Accordion key={'interrogated-plugin-list'} exclusive={false}>
        {list}
      </Accordion.Accordion>
    ]);
  };

  genList = () => {
    if (this.state.allPluginsLoaded) {
      return this.genPluginList();
    }
    else {
      return this.genLoadingList();
    }
  };

  render() {
    return (
      <div>
        {this.genList()}
      </div>
    );
  }
}
