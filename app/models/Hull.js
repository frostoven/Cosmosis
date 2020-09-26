import React from 'react';
import * as CANNON from 'cannon';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import { useCannon, Provider } from '../local/useCannon';
import { useLoader } from "react-three-fiber";

const loader = new GLTFLoader();

export default function Ship({ position }) {
  // https://github.com/pmndrs/react-three-fiber/issues/376
  const gltf = useLoader(
    GLTFLoader,
    '/assets/models/hull_low_poly.gltf',
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('three/examples/js/libs/draco/');
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
      dracoLoader.dispose();
    }
  );

  console.log('Hull GLTF:', gltf);
  const material = gltf.scene.children[0].material;
  // const normal = gltf.scene.children[0].material.normalMap;

  const { nodes } = gltf;

  // Register box as a physics body with mass
  const ref = useCannon({ mass: 100000 }, body => {
    body.addShape(new CANNON.Box(new CANNON.Vec3(1, 1, 1)));
    body.position.set(...position);
  });

  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      geometry={nodes.main.geometry}
      material={material}
      >
    </mesh>
    /*
      <boxGeometry attach="geometry" args={[2, 2, 2]} />
      <meshStandardMaterial attach="material" roughness={0.5} color="#575757" />
    */
  )
}
