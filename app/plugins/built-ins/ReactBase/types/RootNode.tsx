import React from 'react';
import { FadeInDown } from '../../../../reactExtra/animations/FadeInDown';
import { InputManager } from '../../InputManager';
import PluginCacheTracker from '../../../../emitters/PluginCacheTracker';
import {
  RegisterMenuSignature,
  RegisteredMenu,
} from '../types/compositionSignatures';
// import MenuHorizontal from '../menuTypes/MenuHorizontal';
// import MenuVertical from '../menuTypes/MenuVertical';
// import MenuGrid from '../menuTypes/MenuGrid';
// import MenuControlSetup from '../menuTypes/MenuControlSetup';
// import { reactMenuControls } from './controls';

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  inputManager: InputManager,
};
const pluginList = Object.keys(pluginDependencies);
type Dependencies = typeof pluginDependencies;

// -- ✀ -----------------------------------------------------------------------

const rootNodeStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.30)',
  zIndex: 25,
};

interface Props {
  // inputBridge: InputBridge,
}

export default class RootNode extends React.Component<Props> {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;

  private registeredMenus: { [name: string]: RegisteredMenu } = {};
  private activeMenuName: string = '';

  state = {
    menuVisible: false,
    // lastAction: 'none',
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
  }

  getActiveMenu() {
    return this.registeredMenus[this.activeMenuName];
  }

  setActiveMenu(name: string) {
    this.activeMenuName = name;
    return this.registeredMenus[name];
  }

  registerMenu(options: RegisterMenuSignature) {
    const name = options.getInputBridge().name;
    if (this.registeredMenus[name]) {
      console.error(`[registeredMenu Menu '${name} already registered.']`);
      return;
    }

    this.registeredMenus[name] = {
      ...options,
      isVisible: false,
    };

    this._pluginCache.inputManager.registerController(
      options.getInputBridge().modeController,
    );
  }

  openMenu(name: string) {
    if (!name) {
      console.error('openMenu requires a name.');
      return;
    }

    if (!this.registeredMenus[name]) {
      console.error(`Cannot open menu "${name}" - menu has not been registered.`);
      return;
    }

    this._autoCloseActiveMenu({ replacement: name });

    this.activeMenuName = name;
    const menu = this.setActiveMenu(name);
    const input = menu.getInputBridge();
    menu.isVisible = true;
    this._pluginCache.inputManager.activateController(
      input.modeId,
      name,
    );

    this.forceUpdate();
  }

  closeMenu(name: string) {
    if (!name) {
      console.error('closeMenu requires a name.');
      return;
    }

    if (!this.registeredMenus[name]) {
      console.error(`Cannot close menu "${name}" - menu has not been registered.`);
      return;
    }

    const menu = this.registeredMenus[name];
    menu.isVisible = false;
    const input = menu.getInputBridge();

    this.setActiveMenu(name);
    this._pluginCache.inputManager.deactivateController(
      input.modeId,
      name,
    );
    // TODO: get active modes. if one has been replaced, remove it from the render queue.

    this.forceUpdate();
  }

  toggleMenu(name: string) {
    if (!name) {
      console.error('toggleMenu requires a name.');
      return;
    }

    if (!this.registeredMenus[name]) {
      console.error(`Cannot toggle menu "${name}" - menu has not been registered.`);
      return;
    }

    const menu = this.registeredMenus[name];
    if (menu.isVisible) {
      this.closeMenu(name);
    }
    else {
      this.openMenu(name);
    }
  }

  getRegisteredMenuNames() {
    return Object.keys(this.registeredMenus);
  }

  /**
   * @param replacement - The name of the menu replacing this one.
   */
  _autoCloseActiveMenu({ replacement }: { replacement: string }) {
    const menu = this.getActiveMenu();
    if (!menu) {
      return;
    }

    // We explicitly check for false because default behaviour is true but
    // default value is undefined.
    const autoClose = menu.autoClose !== false;
    const activeMenuName = menu.getInputBridge().name;
    if (menu.isVisible && autoClose && activeMenuName !== replacement) {
      this.closeMenu(activeMenuName);
    }
  }

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
    // const visibleMenus: RegisteredMenu[] = [];
    const allMenus = Object.values(this.registeredMenus);
    const visibleMenus = allMenus.filter(menu => menu.isVisible);

    if (!visibleMenus.length) {
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
        {visibleMenus.map((value) => {
          const MenuComponent = value.getComponent();
          const inputBridge = value.getInputBridge();
          return (
            <MenuComponent
              key={inputBridge.name}
              options={menuOptions}
              pluginOptions={value}
            />
          );
        })}
      </FadeInDown>
    );
  }
}
