import { FrontSide } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import AssetFinder from '../../../../local/AssetFinder';
import ChangeTracker from 'change-tracker/src';
import { MeshTypes } from './MeshTypes';
import AreaLight from './AreaLight';

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

            const userData = node.userData;
            const type = userData.type;

            switch (type) {
              case MeshTypes.areaLight:
                // console.log(`Item (isMesh=${node.isMesh}) node:`, node);
                const light = new AreaLight(node).getLight();
                gltf.scene.remove(node);
                gltf.scene.add(light);
                break;
            }
          });

          this.trackedMesh.setValue(gltf);
        });
      }
    });
  }
}
