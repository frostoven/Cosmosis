## Introduction

You may think of a mode controller as a "reality controller" of sorts. It takes
input and uses it to transform world state. Note that "no" input is still
"input," meaning that doing nothing still has meaning to a mode controller.
Mode controllers are therefore used to update the game each frame, and how
they do so is influenced by user action.

Mode controllers are used to, for example, calculate how a spaceship's
position changes each frame. It will continue to do so even of the spaceship
scene is not currently being rendered.

If anything listens for user input, it's defined in one of these
subdirectories. If something listens for user input in another folder that is
not in modeControl, then it's in the wrong place and should be moved here
(plugins do not count, and are allowed to listen from wherever they please).

## Technical description

Mode control refers to input listeners that bridge user input with some
high-level idea. Basically, local/contextualInput transforms user input into an
action name, and then passes that action to a mode controller. Action names are
defined in local/controls.

## Logic

You can think of all input receivers as 'modes'. For example, you fly a ship
while in shipPilot mode. You walk around in a ship while in shipPassenger mode.
If floating around freely while disregarding physics, you're in freeCam mode.

Menus are also modes. Pressing Esc in the game will show the in-game menu,
referred to as gameMenu mode.

Some modes are mutually exclusive of one another, while others are not. For
example, you are in (almost) complete control of the ship while the game menu
is open. Any keys you press while in the menu not actually bound to a menu
action will be sent to the ship's controls instead. This allows you to do
things like changing equipment while running from enemies without the need to
pause the game.

On the other hand, freeCam and shipPilot are mutually exclusive because you
cannot have two controllers controlling the camera at the same time.

There are several pre-prepared mode instances in contextualInput. When we
define, say, freeCam and shipPilot in modeControl, we enrol them in the same
mode instance (contextualInput.camController). Doing so guarantees they are
mutually exclusive. We then create gameMenu in a different mode instance
(contextualInput.menuController). Because menuController and camController are
separate contextualInput mode instances, they are independent of one another
and can receive input simultaneously, allowing the player to multitask them.

// TODO: update this.
Note: subfolders in modeControl contain mutually exclusive modes. For example, shipPilot.js and freeCam.js in camControllers/ are mutually exclusive. [] are mutually exclusive. But no camControllers are mutually exclusive with other folders (such as []).

## Implementation

All controllers need to export an init function, which should then be run via
`modeControl/index.js`. If you do not need an init function, simply define
it as a blank function.

The purpose of mode controllers is to receive an action (for example
'moveForward') and do something high level with it. They do NOT receive _keys_
(for example 'W'). There are of course exceptions to the rule, but generally if
you either want to:
1) receive raw key input, or
2) don't care about translating actions into something the player can directly experience,

then chances are your logic doesn't belong in a mode controller.
