import AssetFinder from './AssetFinder';
import fs from 'fs';
import ChangeTracker from 'change-tracker/src';

export default class WebWorkerRuntimeBridge {
  static _webWorkerRuntimeBridgeInstance: WebWorkerRuntimeBridge;

  private _resizeWatchers!: ChangeTracker;

  // Inside the worker main thread class (eg. OffscreenGalaxyWorker),
  // instantiate this object. Forward all 'BridgeRequest' events to
  // receiveMessage. It will respond by calling receiveRuntimeBridgeResponse
  // from your owning instance.
  constructor() {
    if (WebWorkerRuntimeBridge._webWorkerRuntimeBridgeInstance) {
      return WebWorkerRuntimeBridge._webWorkerRuntimeBridgeInstance;
    }
    else {
      WebWorkerRuntimeBridge._webWorkerRuntimeBridgeInstance = this;
    }

    this._resizeWatchers = new ChangeTracker();
    this._setupListeners();
  }

  _setupListeners() {
    window.addEventListener('resize', () => {
      this._resizeWatchers.setValue({
        serialData: {
          width: window.innerWidth,
          height: window.innerHeight,
          pixelRatio: window.devicePixelRatio,
        }
      });
    });
  }

  gameRuntime = {
    getOnce: (pluginName) => {},
    getEveryChange: (pluginName) => {},
  };

  // Automatically calls the right function based on the options. A callback is
  // only required if the target function needs one.
  auto(options, callback) {
    const fn = this[options.fn];
    if (!fn) {
      const error = `[WebWorkerRuntimeBridge] '${fn}' in not a valid endpoint.`;
      console.error(error);
      return callback(error);
    }

    if (fn === this.gameRuntime) {
      return console.error('[WebWorkerRuntimeBridge] gameRuntime not yet supported.');
    }

    fn.call(this, options, callback);
  }

  alert(text) {
    alert(text);
  }

  loadAsset({ assetName, catalogFunction }, callback: Function) {
    const loader = AssetFinder[catalogFunction].bind(AssetFinder);
    loader({
      name: assetName,
      callback: (error, fileName, parentDir, extension) => {
        if (error) {
          console.error(error);
          return callback(error);
        }
        fs.readFile(`${parentDir}/${fileName}`, (error, data) => {
          if (error) {
            console.error(error);
            return callback(error);
          }
          callback(null, { serialData: null, bufferData: data });
        });
      }
    });
  }

  onWindowResize(_, callback) {
    this._resizeWatchers.getEveryChange(data => callback(null, data));
  }
}
