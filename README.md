# Cosmosis
**Note: this game is still pre-alpha. Expect a terrible experience.**

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for instructions on running
this application.

Demo:
![Demo](demo.gif)

## What is Cosmosis?
Cosmosis plans to eventually be a high quality open world space exploration
game. It will have the Milky Way galaxy as its home and use real NASA data
where possible. Where NASA data does not exist, procedural generation will be
used. In this regard it aims to be hyperrealistic.

Space flight will be very flight-sim-like (i.e. player has manual control over
every aspect of the ship). Ship internals will be modular. It currently has
functional warp drives (but no celestial bodies to travel to yet). A physics
system is being implemented.

Planets and their (hostile Lovecraftian) inhabitants will be procedurally
generated, and ground-based combat will be souls-like.

The source is made available to all users for backup and modding purposes, but
this project is not free (see [Why we provide source code](README.md#why-we-provide-source-code) below).

## Why this game?
#### Intro
Cosmosis was brought into existence for the following reasons:
* Many current 'good' space sims out there are either many (MANY) years in
  development with no end in sight, or the devs have lost touch with their
  audiences and make their games worse with updates each year. Even worse,
  you can't simply downgrade to a version you like and play offline.
* None of the space games I'm personally interested in have good (if any)
  modding support.
* Souls clones developers try add a little extra to something to make their
  games unique. This project will to stay true to the original formulas as much
  as possible.

#### Excellent modding support
You can make a fully interactable space ship yourself **with zero programming
experience**. All you need is a copy of Blender 2.8 and to follow the guide on
mesh codes. Blender does not even need any special add-ons for this to work,
though a future add-on is on the roadmap to make some tedious tasks faster.

If you are a coder, coded modding support is planned but currently low priority
due to the fact the game is still rapidly changing. Adding such support in
future is trivial, because the game is written in JavaScript.

#### Why we provide source code
There are two niches out there that get poor development: space sims, and
souls clones. The developers of space sims seem incredibly out of touch with
what their fans want (or just incredibly greedy, who knows ¯\_(ツ)_/¯), and
souls clones do things in ways that completely miss the point of the original Souls Master's
vision (in this author's subjective opinion, of course).

This project will probably make the exact same mistakes. The difference here is
that Cosmosis is not a locked behind closed source corporate red tape. You
don't like what's been done, mod it out. Tweak it. Change it. Make it yours and
release your changes as a better fork, perhaps propose those changes make their
way back here. The point here is that control is in your hands, not some
developer who's stopped caring about you and the promises they made during
their Kickstarter.

## Flavourful propaganda
Explore a universe gone insane and unlock its deeper truths... or simply don't
bother and drown your sorrows at Bernie's Bar and Brothel while looking for new
bounty missions to fuel your drug addiction.

<!-- We aim to be the following; uncomment when achieved :) --
Cosmosis is an open world space game with RPG elements. It aims to have
realistic space ship mechanics (if a game with FTL and Lovecraftian Great
Ones can fall into such a category), and souls-like combat on planets. It also
has an FPS shooter class for those who do refuse to praise the sun
\[blasphemes].
-->
Cosmosis is an early concept for an open world space game, potentially with
planetary combat and procedural environments. The current priority is to create
a pvp space battle game with arenas next to beautifully rendered procedural
planets.

It hopes to one day emulate the Milky Way with acceptable precision. The real
issue here is not a technical one, but rather task priority (make it an
actually fun game before making it a galaxy sim). The engine already supports
flying thousands of light years to distant celestial bodies in an instant with
no loading screens.
