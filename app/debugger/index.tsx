import fs from 'fs';
import userProfile from '../userProfile';
import { onReadyToBoot } from '../local/windowLoadListener';
import React from 'react';
import * as ReactDOM from 'react-dom';
import CosmDbgMain from './components/CosmDbgMain';
import { CosmDbgConfig } from './types/CosmDbgConfig';
import { HeightSetting } from './components/types/HeightSetting';

const CONFIG_FILE = 'cosmDbg.json';

const defaultPosition = 'topLeft';
const englishToCoords = {
  top: { top: '0', left: '50%', transform: 'translateX(-50%)' },
  topRight: { top: '0', right: '0' },
  right: { right: '0', top: '50%', transform: 'translateY(-50%)' },
  bottomRight: { bottom: '0', right: '0' },
  bottom: { bottom: '0', left: '50%', transform: 'translateX(-50%)' },
  bottomLeft: { bottom: '0', left: '0' },
  left: { top: '50%', transform: 'translateY(-50%)' },
  topLeft: { top: '0', left: '0' },
  center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)'  },
};

const stringifyPretty = (data: any) => {
  return JSON.stringify(data, null, 4);
};

export default class CosmDbg {
  public firstTimeBoot: boolean;
  private _configState: CosmDbgConfig;
  private _packageJson: { [key: string]: any };
  private _storageDir: string | null;
  private _storageLocation: string | null;
  private _mainDiv!: HTMLElement;

  constructor() {
    this.firstTimeBoot = false;
    this._configState = {};
    this._packageJson = {};
    this._storageDir = null;
    this._storageLocation = null;
    this._loadPackageJson(() => {
      this._setupStorage(() => {
        this._loadConfig(() => {
          onReadyToBoot(() => this._setupUI());
        });
      })
    });
  }

  _loadPackageJson(onDone = (error) => {}) {
    fs.readFile('package.json', (error, data) => {
      if (error) {
        console.error('[CosmDbg]', error);
        onDone(error);
      }
      else {
        try {
          // @ts-ignore - parse does actually take buffers.
          this._packageJson = JSON.parse(data);
        }
        catch (error) {
          console.error('[debugger]', error);
          // @ts-ignore - this is valid.
          this._packageJson = {
            error: error + '',
          };
        }
        onDone(null);
      }
    });
  }

  _setupStorage(onDone = (error) => {}) {
    if (!Object.values(this._packageJson).length) {
      onDone('package.json not loaded.');
      return;
    }

    const userDataDir = userProfile.getUserDataDir();
    if (!userDataDir) {
      console.warn('[CosmDbg] Could not get user data directory.');
      onDone('Could not get user data directory.');
      return;
    }

    const gameDataDirName = this._packageJson.gameDataDirName;
    this._storageDir = `${userDataDir}/${gameDataDirName}`;
    this._storageLocation = `${this._storageDir}/${CONFIG_FILE}`;

    // There is no OS where we can reasonably have a profile path with such few
    // characters, unless the user has a super-strange profile path such as
    // /a. Even a profile saved in /tmp will pass this test when accounting for
    // slashes.
    const minLen = gameDataDirName.length + 5;
    if (this._storageDir.length < minLen || this._storageLocation.length < minLen) {
      const message = '[debugger] Profile path very short. ' +
        'This is likely a bug. Abort.';
      console.error(message);
      throw message;
    }

    fs.exists(this._storageLocation, (exists) => {
      if (!exists) {
        this.firstTimeBoot = true;
        this.resetState(false);
        // @ts-ignore.
        fs.writeFile(this._storageLocation, stringifyPretty({}), (error) => {
          if (error) {
            console.warn('[CosmDbg]', error);
            onDone(error);
          }
          else {
            onDone(null);
          }
        });
      }
      else {
        onDone(null);
      }
    });
  }

  _setupUI() {
    if (this._configState.debugUiVisible) {
      this.showUI();
    }
  }

  _loadConfig(onDone = (error) => {}) {
    if (!this._storageLocation) {
      return;
    }

    fs.readFile(this._storageLocation, (error, data) => {
      if (error) {
        console.error('[CosmDbg]', error);
        onDone(error);
      }
      else {
        try {
          // @ts-ignore - parse does actually take buffers.
          data = JSON.parse(data);
        }
        catch (error) {
          console.error('[debugger', error);
          // @ts-ignore - this is valid.
          data = {};
        }
        if (!Object.values(data).length) {
          this.firstTimeBoot = true;
        }
        Object.assign(this._configState, data);
        onDone(null);
      }
    });
  }

  _saveConfig(onDone = (error) => {}) {
    if (!this._storageLocation) {
      return;
    }

    fs.writeFile(
      this._storageLocation,
      stringifyPretty(this._configState),
      (error) => {
        if (error) {
          console.error('[CosmDbg]', error);
        }
      }
    );
  }

  get storageDir() {
    return this._storageDir;
  }

  set storageDir(v) {
    const message = '[debugger] storageDir is read-only.';
    console.error(message);
    throw message;
  }

  setOption(key: string, value: any) {
    this._configState[key] = value;
    this._saveConfig();
  }

  getState() {
    return this._configState;
  }

  resetState(autoSave = true) {
    this._configState = {
      debugUiVisible: this._configState.debugUiVisible,
      uiState: { modalSize: HeightSetting.large },
    };

    if (autoSave) {
      this._saveConfig();
    }
  }

  showUI() {
    let mainDiv = document.getElementById('cosm-dbg');
    if (!mainDiv) {
      mainDiv = document.createElement('div');
      mainDiv.id = 'cosm-dbg';
      document.body.append(mainDiv);
      this._mainDiv = mainDiv;
      this.moveToDefaultPosition();
      ReactDOM.render(
        <CosmDbgMain firstTimeBoot={this.firstTimeBoot}/>,
        mainDiv
      );
    }
    this._mainDiv.style.display = 'block';
    this.setOption('debugUiVisible', true);
  }

  hideUI() {
    this._mainDiv.style.display = 'none';
    this.setOption('debugUiVisible', false);
  }

  moveToDefaultPosition() {
    let mainDiv = document.getElementById('cosm-dbg');
    if (!mainDiv) {
      return;
    }

    const defaultPosString = this._configState.uiState?.settingsDefaultPosition;
    let style = englishToCoords[defaultPosString] || englishToCoords[defaultPosition];

    mainDiv.style.top = style.top || '';
    mainDiv.style.left = style.left || '';
    mainDiv.style.bottom = style.bottom || '';
    mainDiv.style.right = style.right || '';
    mainDiv.style.transform = style.transform || '';
  }
}

const cosmDbg = new CosmDbg();

// @ts-ignore
window.$cosmDbg = cosmDbg;

export {
  cosmDbg,
}
