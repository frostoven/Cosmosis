import { BackSide, FrontSide } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import AssetFinder from '../../../../local/AssetFinder';
import ChangeTracker from 'change-tracker/src';
import MeshCodeHandler from '../../NodeOps/types/MeshCodeHandler';
import { MeshLoaderOpts } from '../interfaces/MeshLoaderOpts';

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath('./node_modules/three/examples/js/libs/draco/');
dracoLoader.setDecoderConfig({ type: 'js' });
dracoLoader.preload();
gltfLoader.setDRACOLoader(dracoLoader);

export default class MeshLoader {
  public trackedMesh: ChangeTracker;

  static defaultNodeOpts: MeshLoaderOpts = {
    backfaceCulling: true,
    castShadow: true,
    receiveShadow: true,
    materialOverrideCallback: null,
  };

  constructor(assetFunctionName: string, assetName: string, nodeOpts?: MeshLoaderOpts) {
    if (!nodeOpts) {
      nodeOpts = MeshLoader.defaultNodeOpts;
    }

    this.trackedMesh = new ChangeTracker();

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
            if (node.isMesh) {
              // Backface culling. Without this shadows get somewhat insane
              // because all faces then emit shadows.
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
  }
}
