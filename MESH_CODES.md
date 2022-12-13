## Intro

Mesh codes are textual tags. How it works is that you select the mesh of
choice, add an object property, and then use the code most appropriate for what
you're trying to achieve.

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

The `type` property determine what kind of object it is (switch, door, light, etc.). Each type has its own additional properties that go with it. For
example, a switch has one or more target doors. Hitboxes may refer to specific
regions (wing, nose, etc.).

All optional properties below are written in `[square brackets]`.

### Area light
```
type: areaLight
[moduleHook]: Name of a module to bind to. Useful with, ex., 'cockpitLights'
[gfxqLight]: low/medium/high | force this light into a gfx quality category
[devHelper]: true/false | If true, shows outlines to help debug the light
```
<!-- TODO: make gfxqLight comma delimited. -->
Creates an
[area light](https://threejs.org/docs/?q=light#api/en/lights/RectAreaLight).

Note that Blender exports these in a way that causes Three.js to import them as
Object3D instances (which happens to be ideal for our purposes).

You'll probably want to use `moduleHook` often. Set to `cockpitLights` if
placing in the cockpit.<!-- TODO: add: , or if used in a room with a switch,
you can target the light with that switch. -->

### Fake light
```
type: fakeLight
moduleHook: [module that deals with lighting] | example: 'cockpitLights'
```
Use this with emissive textures. An emissive texture will have its emissive
intensity cycled between 0 (off) and 1 (on) when being switched off and on.

Fake lights are meant to be used alongside real lights. For example, if you
create an area light, switching it on and off won't affect any emissive
materials of the light fixture meshes you have next to the real light. Your
light fixture meshes should be tagged as fake lights; when toggled,
light-handler modules will toggle its emissive intensity.
<!-- TODO: show example of fake light combined with area light here -->

Important note: if in Blender you use a single emissive texture on multiple
light fixtures, the game engine will assume all emissive textures are part of
the same light circuit and power them all off even if you target just one. This
is a performance optimisation that drastically reduces the amount of work
involved with changing fake light power state. If you would like to avoid this
optimisation for certain lights, clone their material in Blender and give them
a different name.

<!-- Planned items

#### Door
```
type: door
[id]: yourString
[switchless]: false
```
The `id` field is only needed if referred to by a switch. You may set
`switchless` to true if the door itself should be interacted with to open it.

#### Switch
```
type: switch
target: yourDoorId
```
The `target` text should be the same as your door's `id` field.

-->
