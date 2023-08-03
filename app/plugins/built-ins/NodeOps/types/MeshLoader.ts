import { BackSide, FrontSide } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import AssetFinder from '../../../../local/AssetFinder';
import ChangeTracker from 'change-tracker/src';
import MeshCodeHandler from '../../NodeOps/types/MeshCodeHandler';
import { MeshLoaderOpts } from '../interfaces/MeshLoaderOpts';

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/');
dracoLoader.setDecoderConfig({ type: 'js' });
dracoLoader.preload();
gltfLoader.setDRACOLoader(dracoLoader);

export default class MeshLoader {
  public trackedMesh: ChangeTracker;
  public assetName: string;
  public nodeOpts: MeshLoaderOpts;

  static defaultNodeOpts: MeshLoaderOpts = {
    backfaceCulling: true,
    castShadow: true,
    receiveShadow: true,
    materialOverrideCallback: null,
  };

  constructor(
    assetName: string = '',
    assetFunctionName: string = '',
    nodeOpts?: MeshLoaderOpts
  ) {
    if (!nodeOpts) {
      nodeOpts = MeshLoader.defaultNodeOpts;
    }

    this.trackedMesh = new ChangeTracker();
    this.assetName = assetName;
    this.nodeOpts = nodeOpts;

    if (assetFunctionName) {
      this._loadMesh(assetFunctionName);
    }
  }

  _loadMesh = (assetFunctionName) => {
    const { assetName, nodeOpts } = this;

    const find = AssetFinder[assetFunctionName].bind(AssetFinder);
    find({
      name: assetName,
      callback: (error, filename, dir) => {
        if (error) {
          console.error(error, filename, dir);
          throw error;
        }

        gltfLoader.setPath(dir + '/');
        gltfLoader.load(filename, (gltf) => {
          const meshCodeHandler = new MeshCodeHandler(gltf);

          gltf.scene.traverse(function(node) {
            // @ts-ignore
            if (node.isMesh) {
              // Backface culling. Without this shadows get somewhat insane
              // because all faces then emit shadows.
              // @ts-ignore
              node.material.side = nodeOpts?.backfaceCulling ? FrontSide : BackSide;
              node.castShadow = nodeOpts?.castShadow;
              node.receiveShadow = nodeOpts?.receiveShadow;

              if (nodeOpts?.materialOverrideCallback) {
                nodeOpts?.materialOverrideCallback(node);
              }
            }

            const userData = node.userData;
            meshCodeHandler.handle({ node, userData });
          });

          this.trackedMesh.setValue({ gltf, inventory: meshCodeHandler.inventory });
        });
      }
    });
  };

  getHudModel = () => {
    this._loadMesh('getHudModel');
    return this;
  };

  getStarCatalog = () => {
    this._loadMesh('getHudModel');
    return this;
  };

  getSpaceship = () => {
    this._loadMesh('getSpaceship');
    return this;
  };
}
