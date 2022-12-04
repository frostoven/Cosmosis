import { FrontSide } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import AssetFinder from '../../../../local/AssetFinder';
import ChangeTracker from 'change-tracker/src';

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath('./node_modules/three/examples/js/libs/draco/');
dracoLoader.setDecoderConfig({ type: 'js' });
dracoLoader.preload();
gltfLoader.setDRACOLoader(dracoLoader);

export default class MeshLoader {
  public trackedMesh: ChangeTracker;

  constructor(assetFunction: string, assetName: string) {
    this.trackedMesh = new ChangeTracker();

    const find = AssetFinder[assetFunction].bind(AssetFinder);
    find({
      name: assetName,
      callback: (error, filename, dir) => {
        if (error) {
          throw error;
        }

        gltfLoader.setPath(dir + '/');
        gltfLoader.load(filename, (gltf) => {

          gltf.scene.traverse(function(node) {
            if (node.isMesh) {
              // Backface culling. Without this shadows get somewhat insane
              // because all faces then emit shadows.
              node.material.side = FrontSide;
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          this.trackedMesh.setValue(gltf);
        });
      }
    });
  }
}
