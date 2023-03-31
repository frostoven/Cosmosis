import React from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { Button, Form } from 'semantic-ui-react';
import { CosmDbgRootUtils } from '../../components/interfaces/CosmDbgRootUtils';
import userProfile from '../../../userProfile';
import { gameRuntime } from '../../../plugins/gameRuntime';

function createSphereAheadOfPlayer(diameter, color) {
  const radius = diameter * 0.5;
  // 256x128 makes it very difficult to see angles, but they do exist. Reduces
  //   FPS 10% for a second on spawn.
  // 512x256 seems perfect, and reduces frames 20% on spawn for a second.
  // We should therefore ideally reuse spheres in the main game if possible.
  const geometry = new THREE.SphereGeometry(radius, 512, 256);
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);

  gameRuntime.tracked.player.getOnce((player) => {
    gameRuntime.tracked.spaceScene.getOnce((scene: THREE.Scene) => {
      const camera: THREE.PerspectiveCamera = player.camera;
      // We add to camera first so that we can easily spawn it in front of the
      // player. We then move it to the level scene and preserve world
      // position.
      camera.add(sphere);
      sphere.translateZ(diameter * -2);
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
    createSphereAheadOfPlayer(12_742, 0x4b749e);
  };

  createJupiterSizedOrb = () => {
    createSphereAheadOfPlayer(139_820, 0xf8be7e);
  };

  createSunSizedOrb = () => {
    createSphereAheadOfPlayer(1_392_680, 0xfff98b);
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
        </Form>
      </div>
    );
  }
}
