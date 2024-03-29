// https://codesandbox.io/embed/r3f-cannon-physics-nr84m
// Modified to include a visual collision debugger.

import * as CANNON from 'cannon';
import * as THREE from 'three';
import './cannonDebugRenderer';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useFrame, useThree } from 'react-three-fiber';

// Cannon-world context provider
const context = React.createContext()
export function Provider({ children }) {
  // Set up physics
  const [world] = useState(() => new CANNON.World())

  // Set up debugger instance
  const { scene } = useThree();
  const cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);

  useEffect(() => {
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    // world.gravity.set(0, 0, -25)
  }, [world])

  // Run world stepper every frame
  useFrame(() => {
    // TODO: check if this is correct. We probably need deltaTime instead.
    world.step(1 / 60);
    cannonDebugRenderer.update();
  })
  // Distribute world via context
  return <context.Provider value={world} children={children} />
}

// Custom hook to maintain a world physics body
export function useCannon({ ...props }, fn, deps = []) {
  const ref = useRef()
  // Get cannon world object
  const world = useContext(context)
  // Instanciate a physics body
  const [body] = useState(() => new CANNON.Body(props))
  useEffect(() => {
    // Call function so the user can add shapes
    fn(body)
    // Add body to world on mount
    world.addBody(body)
    // Remove body on unmount
    return () => world.removeBody(body)
  }, deps)

  useFrame(() => {
    if (ref.current) {
      // Transport cannon physics into the referenced threejs object
      ref.current.position.copy(body.position)
      ref.current.quaternion.copy(body.quaternion)
    }
  })

  return ref
}
