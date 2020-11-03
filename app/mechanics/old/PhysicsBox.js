import React from 'react';
import * as CANNON from 'cannon';
import { useCannon, Provider } from '../local/useCannon';

export default function PhysicsBox({ position }) {
  // Register box as a physics body with mass
  const ref = useCannon({ mass: 100000 }, body => {
    body.addShape(new CANNON.Box(new CANNON.Vec3(1, 1, 1)));
    body.position.set(...position);
    // Godot's physics engine has a bug where it dampens movement at very low
    // angular velocity, even if dampening is set to 0. This is the core reason
    // Godot was not used for this project. This line here tests for that bug.
    // Spoiler alert: it passes with flying colours.
    body.angularVelocity = new CANNON.Vec3(0.0125, 0.0125, 0.0125);
  })
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry attach="geometry" args={[2, 2, 2]} />
      <meshStandardMaterial attach="material" roughness={0.5} color="#575757" />
    </mesh>
  )
}
