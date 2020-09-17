import React, { useRef, useEffect } from 'react'
import { extend, useThree, useFrame } from 'react-three-fiber'
import { EffectComposer } from '../../../node_modules/three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from '../../../node_modules/three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from '../../../node_modules/three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from '../../../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass'
import { FilmPass } from '../../../node_modules/three/examples/jsm/postprocessing/FilmPass'

import { animateFreeCam } from '../../local/core';

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, FilmPass })

export default function Effects() {
    const composer = useRef()
    const { scene, gl, size, camera } = useThree()
    useEffect(() => void composer.current.setSize(size.width, size.height), [size])
    useFrame(() => {
        animateFreeCam(scene);
        composer.current.render();
    }, 2)
    return (
        <effectComposer ref={composer} args={[gl]}>
            <renderPass attachArray="passes" scene={scene} camera={camera} />
            {/*<unrealBloomPass attachArray="passes" args={[undefined, 1.8, 1, 0]} />*/}
        </effectComposer>
    )
}
