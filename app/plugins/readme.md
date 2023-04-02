## Intro

_Note: this document is not complete, and still needs to be added to._

Cosmosis tries to follow a plugin structure where possible these days. If the
community makes plugins, we call them mods for disambiguation.

## Best practices

_This is more for Cosmosis devs, but may be useful to community modders as
well._

* Mods are allowed to use plugins for logic. Plugins should never directly use
mods for logic.
* Cosmosis code that is not a plugin should never use plugin code. For example,
if non-plugin code needs the level scene, it either needs to be rewritten as a
plugin, or a plugin should be written to pass it the scene. If non-plugin code
is accidentally written that uses plugin logic, that code should be converted
to a plugin, or deleted. There is one exception to the rule: the debugger; the
debugger may break any rules for the purposes of rapid development.
