import fs from 'fs';
import userProfile from '../userProfile';
import { onReadyToBoot } from '../local/windowLoadListener';
import React from 'react';
import * as ReactDOM from 'react-dom';
import CosmDbgMain from './components/CosmDbgMain';
import { CosmDbgConfig } from './types/CosmDbgConfig';

const CONFIG_FILE = 'cosmDbg.json';

const stringifyPretty = (data: any) => {
  return JSON.stringify(data, null, 4);
};

export default class CosmDbg {
  private _configState: CosmDbgConfig;
  private _packageJson: { [key: string]: any };
  private _storageLocation: string | null;
  private _mainDiv!: HTMLElement;

  constructor() {
    this._configState = {};
    this._packageJson = {};
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
        // @ts-ignore - parse does actually take buffers.
        this._packageJson = JSON.parse(data);
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
    this._storageLocation = `${userDataDir}/${gameDataDirName}/${CONFIG_FILE}`;
    fs.exists(this._storageLocation, (exists) => {
      if (!exists) {
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
        // @ts-ignore - parse does actually take buffers.
        data = JSON.parse(data);
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

  setOption(key: string, value: any) {
    this._configState[key] = value;
    this._saveConfig();
  }

  getState() {
    return this._configState;
  }

  resetState() {
    this._configState = { debugUiVisible: this._configState.debugUiVisible };
    this._saveConfig();
  }

  showUI() {
    let mainDiv = document.getElementById('cosm-dbg');
    if (!mainDiv) {
      mainDiv = document.createElement('div');
      mainDiv.id = 'cosm-dbg';
      document.body.append(mainDiv);
      this._mainDiv = mainDiv;
      ReactDOM.render(<CosmDbgMain/>, mainDiv);
    }
    this._mainDiv.style.display = 'block';
    this.setOption('debugUiVisible', true);
  }

  hideUI() {
    this._mainDiv.style.display = 'none';
    this.setOption('debugUiVisible', false);
  }
}

const cosmDbg = new CosmDbg();

// @ts-ignore
window.$cosmDbg = cosmDbg;

export {
  cosmDbg,
}
