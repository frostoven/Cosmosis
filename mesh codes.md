**This document is now out of date. TODO: update me.**

## Introduction

Mesh codes are used to tell the engine how individual nodes are to be treated
by the engine. This allows everything from dynamic ship functions (doors,
lights) to defining how destructible things work - all without adding any code
to the game for that mesh. Simply copy-paste your exported files and you're
done.

Note that the above assumes we're using something GLTF compatible, and has not
yet been tested with other file formats.

Please use prefix_fullMeshName when naming nodes in your mesh. Example:
e5_rearLoadingBay

Some ship terms:
https://www.macmillandictionary.com/thesaurus-category/british/parts-of-boats-and-ships

Editor type -> Text editor
```python
import bpy

def ShowMessageBox(message = "", title = "Message Box", icon = 'INFO'):
    def draw(self, context):
        self.layout.label(text=message)
    bpy.context.window_manager.popup_menu(draw, title = title, icon = icon)

objs = [obj for obj in bpy.data.objects]

count = 0
modified = 0
for obj in objs:
    count += 1
    if not "code" in obj:
        obj["code"] = ""
        modified += 1
        
ShowMessageBox("Done; " + str(modified) + " of " + str(count) + " objects modified.", "Mesh codes")
```
^^ 2.9. for older versions, change `self.layout.label(text=message)` to `self.layout.label(message)`

## Nomenclature
Interactable node: nodes that the player can interact with by pressing the use key.
Material codes: used for dynamic lighting and cosmetic changes.
Collision node: a shape that is used for collision detection. For example, shooting someone's weapon might damage or disable it.

## Interactable node codes
if you prefix the name of a blender object with one of the below, the engine
will apply game logic to that object.

##### Bridge
|code|Description
|------|-----------
|`c1_`     | Captain's seat (use a camera object). Interactable. Place it where the player's head goes.
|`c2[-9]_` | Bridge seat (camera object). 8 total. Interactable.
|`cx_`     | Seat the player can sit in  (camera object). Interactable.
|`cc_`     | Outside camera. If there's more than 1, they're cycled alphabetically.

##### Destructibility of non-interactables
|code|Description
|------|-----------
|`d0_`     | Hide from scene when the ship is destroyed.
|`d1_`     | Partial destructible - scatter object upon ship destruction, but leave it in one peace.
|`d2_`     | Fully destructible - break the object into smaller pieces when the ship is destroyed.

##### Doors and entrances
|code|Description
|------|-----------
|`e1_`     | Door that slides left 98% (no animation baked into mesh).
|`e2_`     | Door that slides right 98% (no animation baked into mesh).
|`e3_`     | Door that slides up 98% (no animation baked into mesh).
|`e4_`     | Door that slides down 98% (no animation baked into mesh).
|`e5_`     | Door - uses animation built into the mesh.
|`e6_`     | Escape pod - no animation baked into mesh.
|`e7_`     | Escape pod - mesh has animation built in.

##### Switches
|code|target|Description
|----|------|-----------
|`s1_nn`   |`nameOfObject`| Switch that opens/closes a door, where `nameOfObject` is the door name. Example: `s1_e5_loadingBay` will open a door named `e5_loadingBay`. Note: 'door' here is only used for demonstration purposes. You can use a switch with any interactable mesh. If it's not a door, then instead of opening/closing, it will activate/deactivate the mesh.
|`s2_nn`   |`nameOfObject`| Like `s1_nn`, but only opens the door.
|`s3_nn`   |`nameOfObject`| Like `s1_nn`, but only closes the door.

##### Windows
|code|Description
|------|-----------
|`w1_`     | Window (dynamic), can accumulate grime.
|`w2_`     | Window, dirty.
|`w3_`     | Window, absolutely filthy.
|`w4_`     | Window, cannot get dirty (useful for indoor areas).
|`w5_`     | Dangerous window - like `w1`, but is destructible. Breaking it causes cabin depressurisation.
|`w6_`     | Secure window - like `w1`, but is destructible. If the windows breaks while the ship has power, a shield will form to protect the cabin and keep air in.

##### Miscellaneous and advanced
|code|Description
|------|-----------
|`z1_`     | Manual ship self-destruct button.
|`z2_`     | Like `z1`, but if more than one `z2` exists, then all of them need to be activate for destruction to take place.
|`z3_`     | Emergency power shutdown.
|`z4_`     | Like `z3`, but if more than one `z4` exists, then all of them need to be activate for shutdown to take place.
|`z5_`     | Manually cycles system emergency light modes.
|`z6_`     | Turn off life support in this section. This will cause the atmosphere to gradually become hypoxic.
|`z7_`     | Turn off life support for the entire ship.
|`x8_`     | Depressurise this section. May cause full ship depressurisation on smaller ships.
|`x9_`     | Like `x8`, but multi switch.
|`x1_`     | Shut down life support.
|`x2_`     | Like `x1`, but multiple required.
|`x3_`     | Eject ship warp core.
|`x4_`     | Like `x3`, but multiple required.
|`xa_`     | Maintenance terminal - provides basic ship computer interface.
|`xb_`     | Maintenance terminal - provides advanced ship computer interface.


##### Material codes
|code|Description
|------|-----------
|`l1_`     | Passive light - these are like LED strips all over the ship. Generally white (normal) or red (warning) or flashing red (critical).
|`l2_`     | Beacons (a.k.a strobe lights / anti-collision lights) - like the blinking lights you find outside aeroplanes.

##### Physics collision node codes
|code|Description
|------|-----------
|`ph_moduleName_`  | Weapon collision. Damages the module named moduleName.
|`pw_`             | Pilot windshield.
|`ph_`             | Generic part of the hull.
|`pf_`             | Hull area close to hyperspace drive. Can be used for indirect damage.
|`pd_`             | External blast door. Damage can make door get stuck when opening.
|`pe_`             | Area near engine. Can be used for indirect damage.
|`pp_`             | Area near core electrical systems. Can be used for indirect damage.
