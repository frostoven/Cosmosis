import React from 'react';
import PluginCacheTracker from '../../../../emitters/PluginCacheTracker';
import Core from '../../Core';
import { InputManager } from '../../InputManager';
import { FadeInDown } from '../../../../reactExtra/animations/FadeInDown';
import InputBridge from './InputBridge';
import MenuHorizontal from '../menuTypes/MenuHorizontal';
import MenuVertical from '../menuTypes/MenuVertical';
import MenuGrid from '../menuTypes/MenuGrid';
import MenuControlSetup from '../menuTypes/MenuControlSetup';
import { reactMenuControls } from './controls';

const rootNodeStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.30)',
  zIndex: 25,
};

type PluginCompletion = PluginCacheTracker & {
  core: Core, inputManager: InputManager,
};

interface Props {
  inputBridge: InputBridge,
}

export default class RootNode extends React.Component<Props> {
  private readonly _input: InputBridge;

  state = {
    menuVisible: false,
    // lastAction: 'none',
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this._input = props.inputBridge;
  }

  componentDidMount() {
    this._input.onAction.getEveryChange(this.handleAction);
  }

  componentWillUnmount() {
    this._input.onAction.removeGetEveryChangeListener(this.handleAction);
  }

  handleAction = (action: string) => {
    console.log('action:', action);
    const menuVisible = this.state.menuVisible;
    if (action === 'back') {
      menuVisible && this._input.deactivateAndCloseMenu();
    }
    else if (action === '_openMenu') {
      !menuVisible && this.showMenu();
    }
    else if (action === '_closeMenu') {
      this.hideMenu();
    }
  };

  showMenu() {
    this.setState({ menuVisible: true });
    this._input.enableArrowStepping = true;
  }

  hideMenu() {
    this.setState({ menuVisible: false });
    this._input.enableArrowStepping = false;
  }

  // render() {
  //   if (!this.state.menuVisible) {
  //     return null;
  //   }
  //
  //   const menuOptions = {
  //     type: 'MenuVertical',
  //     default: 1,
  //     entries: [
  //       { name: 'Item 1', onSelect: (e) => console.log('selected 1:', e) },
  //       { name: 'Item 2', onSelect: (e) => console.log('selected 2:', e) },
  //       { name: 'Item 3', onSelect: (e) => console.log('selected 3:', e) },
  //     ],
  //     alwaysShowDescriptionBox: true,
  //   };
  //
  //   return (
  //     <FadeInDown style={rootNodeStyle}>
  //       <MenuVertical
  //         options={menuOptions}
  //       >
  //         Test
  //       </MenuVertical>
  //     </FadeInDown>
  //   );
  // }


  // render() {
  //   if (!this.state.menuVisible) {
  //     return null;
  //   }
  //
  //   // const menuOptions = {
  //   //   type: 'MenuVertical',
  //   //   defaultIndex: 1,
  //   //   entries: [
  //   //     { name: 'Item 1', onSelect: (e) => console.log('selected 1:', e) },
  //   //     { name: 'Item 2', onSelect: (e) => console.log('selected 2:', e) },
  //   //     { name: 'Item 3', onSelect: (e) => console.log('selected 3:', e) },
  //   //   ],
  //   //   alwaysShowDescriptionBox: true,
  //   // };
  //
  //   // const entries = [
  //   //   ['',   '',        '',          '',            '',           '',      ''],
  //   //   ['',   '',        '',     'debug tools',      '',           '',      ''],
  //   //   ['',   '',        '',      'tutorials',       '',           '',      ''],
  //   //   ['',   '',        '',     'multiplayer',      '',           '',      ''],
  //   //   ['', 'stats', 'inventory',  'resume',     'galaxy map', 'solar map', ''],
  //   //   ['',   '',        '',       'journal',        '',           '',      ''],
  //   //   ['',   '',        '',       'options',        '',           '',      ''],
  //   //   ['',   '',        '',        'quit',          '',           '',      ''],
  //   //   ['',   '',        '',          '',            '',           '',      ''],
  //   // ];
  //   // const menuOptions = {
  //   //   type: 'MenuGrid',
  //   //   defaultIndex: { row: 4, column: 3 },
  //   //   entries,
  //   // };
  //
  //   const menuOptions = {
  //     type: 'MenuControlSetup',
  //     defaultIndex: 1,
  //     entries: [
  //       { name: 'Item 4', onSelect: (e) => console.log('selected 1:', e) },
  //       { name: 'Item 5', onSelect: (e) => console.log('selected 2:', e) },
  //       { name: 'Item 6', onSelect: (e) => console.log('selected 3:', e) },
  //     ],
  //   };
  //
  //   return (
  //     <FadeInDown style={rootNodeStyle}>
  //       <MenuControlSetup
  //         options={menuOptions}
  //       >
  //         Test
  //       </MenuControlSetup>
  //     </FadeInDown>
  //   );
  // }

  render() {
    if (!this.state.menuVisible) {
      return null;
    }

    // const menuOptions = {
    //   type: 'MenuVertical',
    //   defaultIndex: 1,
    //   entries: [
    //     { name: 'Item 1', onSelect: (e) => console.log('selected 1:', e) },
    //     { name: 'Item 2', onSelect: (e) => console.log('selected 2:', e) },
    //     { name: 'Item 3', onSelect: (e) => console.log('selected 3:', e) },
    //   ],
    //   alwaysShowDescriptionBox: true,
    // };

    // const entries = [
    //   ['',   '',        '',          '',            '',           '',      ''],
    //   ['',   '',        '',     'debug tools',      '',           '',      ''],
    //   ['',   '',        '',      'tutorials',       '',           '',      ''],
    //   ['',   '',        '',     'multiplayer',      '',           '',      ''],
    //   ['', 'stats', 'inventory',  'resume',     'galaxy map', 'solar map', ''],
    //   ['',   '',        '',       'journal',        '',           '',      ''],
    //   ['',   '',        '',       'options',        '',           '',      ''],
    //   ['',   '',        '',        'quit',          '',           '',      ''],
    //   ['',   '',        '',          '',            '',           '',      ''],
    // ];
    // const menuOptions = {
    //   type: 'MenuGrid',
    //   defaultIndex: { row: 4, column: 3 },
    //   entries,
    // };

    const menuOptions = {
      type: 'MenuControlSetup',
      // defaultIndex: 5,
    };

    return (
      <FadeInDown style={rootNodeStyle}>
        <MenuControlSetup
          // @ts-ignore - still being developed.
          options={menuOptions}
        >
          Test
        </MenuControlSetup>
      </FadeInDown>
    );
  }
}
