## Player control modes

_This documentation may become outdated if not regularly updated; please refer
to the source code as the final source of truth. If you find any discrepancies,
update this document accordingly._

### What are modes?

A mode is a control instance responsible for responding to user input. Modes
may include functionalities such as helm control, menu navigation, and
character movement. Mode priorities are also referred to as mode IDs; you can
view all available IDs
[here](../InputManager/types/ModeId.ts).

Each mode, like all plugins, has its own keybindings. If two modes have
conflicting keybindings, the mode with the highest priority will receive the
input, while the lower-priority mode will not. For example, if the W key is
assigned to both "Thrust Increase" and "Menu Up," pressing W will only
trigger "Thrust Increase" if no menus are open. Conversely, if the menu does
not bind the W key, pressing W will trigger "Thrust Increase" even if a menu is
open.

We assign the same priority to two modes if they are intended to be mutually
exclusive. For example, helm control and developer free-cam ghost flight have
the same priority since they are not meant to be active simultaneously.
Activating one will automatically cause the game engine to deactivate the
other.

_There is one exception to all of this: the in-game menu. Due to the
complexities of implementing a coherent React menu system within a game
context, only one menu mode is supported, and it is the built-in one. If you
want to create a custom menu, please hook into the built-in React base plugin
instead of making your own from scratch._

### High-level overview

As noted above, higher priority modes receive bindings in the event of a key
conflict. A lower mode number indicates a higher priority.

At the time of writing, these are the control modes in use:

| Mode              | Used by                                                                                      |
|-------------------|----------------------------------------------------------------------------------------------|
| 1: App control    | The underlying application. Includes only essential controls.                                |
| 2: Menu System    | Reserved for exclusive use be the in-game menu.                                              |
| 3: Flight Control | Used for ship helm control. Also used by the dev free-cam ghost mode to fly around the ship. |
| 4: Buckled Pilot  | Used to look around the cockpit while strapped to the pilot seat.                            |
| 5: Virtual Menu   | Not yet in use; planned for in-game ship computer interfaces.                                |
| 6: Player Control | Not yet in use; planned for ship traversal once first-person walking is implemented.         |
