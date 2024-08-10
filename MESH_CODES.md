## Intro

Mesh codes are textual tags set from within Blender. How it works, is that you
select the needed mesh, and then add an object property that instructs the
engine to treat that object in a special way. An example of this is using
switches to open doors.

**Note:** we've created a Blender plugin available at
[frostoven/Cosmosis-Blender-Add-On](https://github.com/frostoven/Cosmosis-Blender-Add-On)
that does all the heavy lifting for you. This document exists for auxiliary
documentation. The plugin is completely optional however, and this document
should be all you need to make your own spaceships.

Examples will follow soon. We had working mesh codes in previous versions, but
they caused some problems, so they're currently being reworked (which makes the
old docs useless).
<!-- TODO: complete the example section
## Example

In the following example we create a setup whereby a switch opens a door. All
the below is done in Blender.

First, animate your door the way you'd animate anything in Blender. You only
need to animate the door opening; the game engine will simply reverse that
animation to close the door.

![door animation](/docs/images/door_animation.gif)

We'll now program the switch. From within Blender, click on your switch, click
`Object Properties`, and then scroll down to `Custom Properties`:

![switch](/docs/images/switch.png)

[explain mesh code]

Now, select the door you want to animate, click `Object Properties`, and then
scroll down to `Custom Properties`:

![door](/docs/images/door.png)

Save and export as GLTF (separate) with DRACO compression:

![export](/docs/images/export_example.png)

Your ship switch can now be interacted with in-game:

[tba]

-->

## Mesh codes

The `csmType` property determine what kind of object it is (switch, door, light, etc.). Each type has its own additional properties that go with it. For
example, a switch has one or more target doors. Hitboxes may refer to specific
regions (wing, nose, etc.).

All optional properties below are written in `[square brackets]`.


### Area light
```
csmType: areaLight
[csmModuleHook]: Name of a module to bind to. Useful with, ex., 'cockpitLights'
[csmGfxqLight]: low/medium/high | force this light into a gfx quality category
[csmDevHelper]: true/false | If true, shows outlines to help debug the light
```

**Warning:** Area lights do not currently work with metal materials (they
reflect no area light whatsoever). You can sort of force it by setting the
material's metallicity to something other than 1 (e.g. 0.96) but this honestly
looks horrible and should not be done.
<!-- My disappoint is immeasurable and my day ruined. I now need to completely
rework the DS69F ship's lighting situation. -->

<!-- TODO: make csmGfxqLight comma delimited. -->
Area lights create a surface that emits light uniformly across a rectangular
face (see
[area light](https://threejs.org/docs/?q=light#api/en/lights/RectAreaLight)).

You'll want to set csmModuleHook if you want this hooked up to the game's
power grid and light switches.
<!-- TODO: add: , or if used in a room with a switch,
you can target the light with that switch. -->


### Fake light
```
csmType: fakeLight
csmModuleHook: [module that deals with lighting] | example: 'cockpitLights'
```
Use this with emissive textures. An emissive texture will have its emissive
intensity cycled between 0 (off) and 1 (on) when being switched off and on.

Fake lights are meant to be used alongside real lights. For example, if you
create an area light, switching it on and off won't affect any emissive
materials of the light fixture meshes you have next to the real light. Your
light fixture meshes should be tagged as fake lights; when toggled,
light-handler modules will toggle its emissive intensity.
<!-- TODO: show example of fake light combined with area light here -->

You'll want to adjust csmModuleHook if you want this hooked up to the game's
power grid and light switches.

Important note: if in Blender you use a single emissive texture on multiple
light fixtures, the game engine will assume all emissive textures are part of
the same light circuit and power them all off even if you target just one. This
is a performance optimisation that drastically reduces the amount of work
involved with changing fake light power state. If you would like to avoid this
optimisation for certain lights, clone their material in Blender and give them
a different name.


### Point light
```
csmType: pointLight
[csmModuleHook]: Name of a module to bind to. Useful with, ex., 'cockpitLights'
[csmGfxqLight]: low/medium/high | force this light into a gfx quality category
[csmDevHelper]: true/false | If true, shows outlines to help debug the light
```
Create a light that emanates rays in all directions.

You'll want to adjust csmModuleHook if you want this hooked up to the game's
power grid and light switches.


### Spotlight
```
csmType: spotlight
[csmModuleHook]: Name of a module to bind to. Useful with, ex., 'cockpitLights'
[csmGfxqLight]: low/medium/high | force this light into a gfx quality category
[csmDevHelper]: true/false | If true, shows outlines to help debug the light
```
Create a focussed light cone.

You'll want to adjust csmModuleHook if you want this hooked up to the game's
power grid and light switches.

<!-- TODO / Planned items

#### Door
```
csmType: door
[id]: yourString
[switchless]: false
```
The `id` field is only needed if referred to by a switch. You may set
`switchless` to true if the door itself should be interacted with to open it.

#### Switch
```
csmType: switch
target: yourDoorId
```
The `target` text should be the same as your door's `id` field.

#### Vehicle controller
These will only be needed if there's no easy way of integrating multiple
animations into a single mesh, leaving it up to the engine to animate
dynamically. We could maybe optionally add the option to use the plugin to link
actions, but it seems hacky and difficult to use, so it wouldn't be the default
workflow.

Example mesh codes if done by the engine:
* flightStick - responds to pitch, yaw, roll. No animations done in Blender.
* yoke - responds to pitch and roll. No animations done in Blender.
* throttle - a control panel; responds to throttle changes. Animation done from
Blender.
* steeringWheel - responds to pitch. No animations done in Blender.

-->

## HUD mesh codes

These mesh codes are specifically for cases where 3D objects are used as HUD
elements.

#### HUD progress blip
```
csmType: hudProgressBlip
csmStepPosition: 1-10
```
Used to indicate some sort of percentage. Useful for example with a ship
throttle.

The exact use-case here is for blips fading in from dim to bright as they're
activated.

#### HUD progress animation
```
csmType: hudProgressAnimation
```
Used to indicate some sort of percentage. Useful for example with a ship
throttle.

For this item, the game engine will play the animation from 0-100 as in
indication of completion.

This item has no configurable options.

## Why aren't obvious objects inferred?

For example, Blender, too, has a SpotLight, and the engine recognizes it as
such during import, so why need a mesh code?

The answer is that we might not actually want some items hooked up to ship
systems. For example, if the player lands on a random large space station, the
player might not have control over walkway lamps. Consequently, it doesn't make
sense to assume, for example, that it's a light belonging to the ship.
