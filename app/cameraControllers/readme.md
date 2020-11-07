## Standard
All camera controllers have similar goals, but thend to end up with very
different implementations. To help keep some code sanity, some conventions
should be followed unless infeasible.

Please see the example.js controller for boilerplate.

## Conventions
* Place keyUpDown flags inside a `const ctrl = {}` schema.
* Place a keyPress logic inside a `const toggles = {}` schema.
* Create a triggerAction function unless you have a good reason not to. Action
triggers are intented to activate the same functionality that key bindings
would. They can be activated by anything at any time, so you should have logic
to disable it when not active. The idea is that triggerAction makes your cam
controller act like an action plugin when appropriate.

## Activating your cam controller.
This is done by registering it as a mode in `core.js`. TODO: detail this
process.
