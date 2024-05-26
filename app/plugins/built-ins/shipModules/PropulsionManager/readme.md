## TL;DR:

The propulsion manager controls all propulsion systems installed in the ship,
and prevents silly behaviour. Propulsion modules (such as the warp drive) rely
on PropulsionManager, but PropulsionManager does not rely on other propulsion
modules.

## Long version:
The problem with propulsion is that we can modify ship position one of many
ways. For example:
* When using an impulse drive, the ship is moved around inside the galaxy.
* In a warp drive, the universe is moved around the ship.
* In a hyperdrive, the ship is shot through a wormhole, effectively
teleporting the ship via event horizon to another part of the galaxy.

All these systems are mutually exclusive; sure - you *can* have an impulse
drive try to do things in a warp field, but it offers no benefit to the user
and messes with in-game coordinate state. We can actually allow the user to
force such things via rewiring, and shear the ship in half when it touches the
warp barrier - but that should be aftermarket customization, not default
behaviour.

The point is, for normal use, allowing both impulse and warp, or both warp and
hyperdrive, at the same time, is not a good idea. At the same time, we should
allow the user to mess themselves up by forcing things. This means we have an
inter-dependence on propulsion systems. That's why we need a manager module to
manage propulsion modules.

## Control mappings
Your propulsion system should not create its own control mappings unless
absolutely necessary. Your propulsion system should also opt-in-and-out of
control mappings as it's activated / deactivated. For pulse events, this
would be done as getEveryChange / removeGetEveryChangeListener calls on
shipPilot interfaces. For non-pulse mechanisms, this involves breaking out
early in your step function before reading shipPilot state.
