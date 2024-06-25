import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { Button, Form } from 'semantic-ui-react';
import {
  CosmDbgRootUtils,
} from '../../components/interfaces/CosmDbgRootUtils';
import userProfile from '../../../userProfile';
import { gameRuntime } from '../../../plugins/gameRuntime';
import finder from '../../../local/AssetFinder';
import MilkyWayGen from '../../../universeFactory/MilkyWayGen';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';

const textureLoader = new THREE.TextureLoader();

function createSphereAheadOfPlayer(name, radius, color, image: string = '') {
  // 256x128 makes it very difficult to see angles, but they do exist. Reduces
  //   FPS 10% for a second on spawn.
  // 512x256 seems perfect, and reduces frames 20% on spawn for a second.
  // We should therefore ideally reuse spheres in the main game if possible.
  const geometry = new THREE.SphereGeometry(radius, 512, 256);
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.name = name || '';

  if (image) {
    _.defer(() => {
      finder.getPlanetImg({
        name: image,
        // @ts-ignore
        callback: (error, fileName, parentDir) => {
          error && console.error(error);
          if (!error) {
            textureLoader.load(`${parentDir}/${fileName}`, (texture) => {
              sphere.material = new THREE.MeshBasicMaterial({ map: texture });
            });
          }
        }
      });
    });
  }

  gameRuntime.tracked.player.getOnce((player) => {
    gameRuntime.tracked.spaceScene.getOnce((scene: THREE.Scene) => {
      const camera: THREE.PerspectiveCamera = player.camera;
      // We add to camera first so that we can easily spawn it in front of the
      // player. We then move it to the level scene and preserve world
      // position.
      camera.add(sphere);
      sphere.translateZ(radius * -4);
      sphere.rotation.x = -2.5581483017135023;
      sphere.rotation.y = 0.7781981609672939;
      sphere.rotation.z = 3.097822463446898;
      scene.attach(sphere);
    });
  });
}

export default class Actions extends React.Component<{ rootUtils: CosmDbgRootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

  openProfileDir = () => {
    userProfile.navigateToDataDir();
  };

  reloadApplication = () => {
    // @ts-ignore
    chrome.tabs.reload();
  };

  createEarthSizedOrb = () => {
    createSphereAheadOfPlayer('12k', 6_371_000, 0x4b749e, 'Land_ocean_ice_cloud_hires');
  };

  createJupiterSizedOrb = () => {
    createSphereAheadOfPlayer('139k', 69_911_000, 0xf8be7e);
  };

  createSunSizedOrb = () => {
    createSphereAheadOfPlayer('1.3m', 696_340_000, 0xfff98b, 'sun_euvi_aia304_2012_carrington');
  };

  creatMicroMilkyWay = () => {
    const start = performance.now();
    const galaxy = new MilkyWayGen().createGalaxy(true);
    console.log(`[Actions] Milky Way took ${performance.now() - start}ms to create.`);
    const cache = new PluginCacheTracker([ 'player', 'levelScene' ]);
    cache.onAllPluginsLoaded.getOnce(() => {
      cache.player.camera.add(galaxy);
      galaxy.translateZ(-200);
      cache.levelScene.attach(galaxy);
    });
  };

  render() {
    return (
      <div>
        {/* @ts-ignore */}
        <Form>
          <h3>General</h3>

          <Form.Field>
            <label>Opens the user profile directory</label>
            <Button fluid onClick={this.openProfileDir}>Open profile directory</Button>
          </Form.Field>

          <Form.Field>
            <label>Soft reload (same thing HMR does)</label>
            <Button fluid onClick={this.reloadApplication}>Reload application</Button>
          </Form.Field>

          <h3>Game objects</h3>

          <Form.Field>
            <label>Creates a sphere 12,742 km in diameter</label>
            <Button fluid onClick={this.createEarthSizedOrb}>Spawn Earth-sized orb</Button>
          </Form.Field>

          <Form.Field>
            <label>Creates a sphere 139,820 km in diameter</label>
            <Button fluid onClick={this.createJupiterSizedOrb}>Spawn Jupiter-sized orb</Button>
          </Form.Field>

          <Form.Field>
            <label>Creates a sphere 1.3927 million km in diameter</label>
            <Button fluid onClick={this.createSunSizedOrb}>Spawn Sun-sized orb</Button>
          </Form.Field>

          <Form.Field>
            <label>Creates floating Milky Way prop (takes time)</label>
            <Button fluid onClick={this.creatMicroMilkyWay}>Spawn micro Milky Way</Button>
          </Form.Field>
        </Form>
      </div>
    );
  }
}
