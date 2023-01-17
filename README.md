<h1 align="center">Cosmosis</h1>

<div align="center">
    <b>Downloads</b>
    <br>
    <a href="https://github.com/frostoven/Cosmosis/releases/latest">
        <img src="https://img.shields.io/static/v1?label=Latest%20stable&message=v0.72.0&color=blue&style=for-the-badge">
    </a>
    <a href="https://github.com/frostoven/Cosmosis/releases">
        <img src="https://img.shields.io/static/v1?label=Dev%20builds&message=all%20versions&color=red&style=for-the-badge">
    </a>
    <br><br>
    <b>Note: this game is still pre-alpha. Expect a terrible experience.</b>
    <br>
    [ Development progress may be tracked via the <a href="https://github.com/aggregate1166877/Cosmosis/projects/1">project page</a> ]
    <br><br>
    Cosmosis is an early work in progress for an open world space game, potentially with  
planetary combat and procedural environments. The current priority is to create  
a PvP space battle game with arenas next to beautifully rendered procedural  
planets.
<br><br>
Demo:
<br>
<img src="demo.gif">

</div>

## Showcase and screenshots
Click <a href="https://github.com/frostoven/frostoven.github.io/blob/main/showcase.md">here</a> to see a showcase of what the engine is currently capable of producing.

The game is rapidly changing, and constantly brings graphical improvements and new features.

## What is Cosmosis?
Cosmosis plans to eventually be a high quality open world space exploration
game. It has the Milky Way galaxy as its home and currently uses real NASA data
for nearby stars (constellations are visible from Earth). A procedural
generation system is currently being designed to be used where NASA data does
not exist. In this regard it aims to be hyperrealistic.

Space flight will be very flight-sim-like (i.e. player has manual control over
every aspect of the ship). Ship internals will be modular. It currently has
functional warp drives, though travel is currently limited while functionality
is smoothed out. A physics system is being implemented.

Planets and their (hostile Lovecraftian) inhabitants will be procedurally
generated. Ground-based combat will probably be souls-like, but that decision
has not been set in stone.

The source is made available to all users for backup and modding purposes,
**but this project is not free**
(see [Why we provide source code](README.md#why-we-provide-source-code) below).

## Testing the game
This game is currently still in pre-alpha, meaning you won't have much to do.
The little you can you is difficult to find because the interfaces that make
some functions obvious (or even visible) do not yet exist. It also has bugs,
and already working features will break while the project rapidly changes.

Important note: this game allows complex menu interactions by allowing mouse
pointer locking / unlocking. If you get stuck wanting to look around but
instead you have only a mouse cursor, press `Left Ctrl` and you'll switch to
mouse-look mode. If you rebind core controls and accidentally break the game,
go to `%AppData%` (Windows) or `~/.local/share/` (Linux) and delete the
directory named `CosmosisGame`, then restart the game.

The latest beta can currently do the following:
* Fly around at many thousand times the speed of light in a to-scale large
  (albeit mostly empty) universe that's millions of light-years across. This
  mode is launched by default, and uses a spaceship with a warp drive and
  nothing else. Note that it currently generates a static skybox based on real
  star data when the game boots; to actually fly amongst nearby stars, see the
  next point.
* Fly around [real Earth-visible stars](https://github.com/frostoven/BSC5P-JSON-XYZ)
  as a ghost. You can activate this mode by pressing Backspace and going to
  `debug tools` -> `Star free-flight`. Use `+` and `-` to change flight speed.
* You can fly around your spaceship by pressing `F8`. If the spaceship has
  switches or other intractables, you can interact with them by pressing `E`.

<!--
TODO: Add menu option to choose a ship, then add a bullet point here that you
can choose ships or even add your own via Blender. This thing of changing
source to change ships needs to change, and soon.
-->

## Troubleshooting
#### Game using wrong graphics card
Windows may force the application to use integrated graphics, which will
massively decrease performance. The game does not yet allow changing graphics
cards, though
[an issue is currently open](https://github.com/frostoven/Cosmosis/issues/61)
to add this feature.

For now, you may force Windows to use discrete graphics by setting power
saving mode to high performance. If your driver configuration does not provide
the option (or you don't like that idea), you can manually force it as follows:
* Open your Windows start menu.
* Within the start menu, go to Settings, then click System.
* Click Display, Scroll down to Graphics Settings.
* Select "Classic app", then click "Browse".
* Navigate to `Cosmosis.exe` and select it.
* Once it's been added to the list click "Options" then select "High
Performance".

## Why this game?
#### Intro
Cosmosis was brought into existence for the following reasons:
* Many current 'good' space sims out there are either many (MANY) years in
  development with no end in sight, or the devs have lost touch with their
  audiences and make their games worse with updates each year. Even worse,
  you can't simply downgrade to a version you like and play offline.
* None of the space games I'm personally interested in have good (if any)
  modding support.
* Souls clones developers try add a little something extra to make their games
  unique. This project will to stay true to the original formulas as much
  as possible. Exceptions to the rule will be for _additional_ classes, not
  traditional ones.

#### Excellent modding support
You can make a fully interactable spaceship yourself **with zero programming
experience**. All you need is a copy of Blender 3.3. We have a
[Blender add-on](https://github.com/frostoven/Cosmosis-Blender-Add-On)
to make this easier, though you can easily manage this without the add-on by
following our guide on [Cosmosis mesh codes](MESH_CODES.md).

If you're a coder, coded modding support is in active development;
documentation and examples will be released soon.

_Note on Blender support: we no longer support Blender 2.93 due to breaking
changes in Blender 3.x GLTF export processes._

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
realistic spaceship mechanics (if a game with FTL and Lovecraftian Great
Ones can fall into such a category), and souls-like combat on planets. It also
has an FPS shooter class for those who do refuse to praise the sun
\[blasphemes].
-->
Cosmosis is an early concept for an open world space game, potentially with
planetary combat and procedural environments. The current priority is to create
a PvP space battle game with arenas next to beautifully rendered procedural
planets.

It hopes to one day emulate the Milky Way with acceptable precision. The real
issue here is not a technical one, but rather task priority (make it an
actually fun game before making it a galaxy sim). The engine already supports
flying thousands of light years to distant celestial bodies in an instant with
no loading screens.
