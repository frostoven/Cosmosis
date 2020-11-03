import React, { useRef, useEffect } from 'react';
import { extend, useThree, useFrame } from 'react-three-fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import core from '../../local/core';

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, FilmPass })

// FPS counter.
const stats = new Stats();
document.body.append(stats.dom);

export default function Effects() {
    const composer = useRef();
    const { scene, gl, size, camera } = useThree();
    useEffect(() => void composer.current.setSize(size.width, size.height), [size])
    useFrame((state, deltaTime) => {
        core.animateFreeCam();
        composer.current.render();
        stats.update();
    }, 2)
    return (
        <effectComposer ref={composer} args={[gl]}>
            <renderPass attachArray="passes" scene={scene} camera={camera} />
            {/*<unrealBloomPass attachArray="passes" args={[undefined, 1.8, 1, 0]} />*/}
        </effectComposer>
    )
}
