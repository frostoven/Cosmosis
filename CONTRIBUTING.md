## Copyright infringement
**If your work has been unlawfully used in this project, please
[raise an issue](https://github.com/feynmansbongos/Cosmosis/issues/new/choose)
and we'll remove it ASAP.** This project is maintained for free during
contributors' spare time, so it may take us a few days to notice the complaint.
However, rest assured copyright infringement is taken very seriously and your issue
_will_ be dealt with. Once the material has been removed, it may take a few
days to disappear from the latest stable release.

If the removal is highly disruptive, a financial backer may request
permission to buy it for continued use in this project and any derivatives.
Note that the agreement will require permission to modify the source work, and
your name will be in the credits. If you decline, or if seven days pass without
further communication from you, we'll proceed with removal anyway. Feel free to
specify that purchase is not an option in the issue raised to make things go
faster.

## Assets

### Mesh file formats
The rules on file formats are somewhat relaxed as some assets may be free
resources obtained online,  and aren't always easily modifiable. However, if
making assets yourself, the following structure is recommended and compatible
with stock Blender:
* Use gltf format (orientation: Y is up).
* Do not embed media (i.e. include as separate files in same folder).
* Use DRACO compression.

The above allows easy community modding with little required technical
expertise. Having said that, any contributions are highly appreciated, so use
whatever you're comfortable with.

### Common issues
##### GLTF export crash
* Blender can sometimes crash if you try to use GLTF compression with messed up
geometry (such as orphaned vertices and lines). The solution here is to find
the bad geometry, fix it, and try again. Deleting objects one by one in a
backup file can help narrow down the issue. It also doesn't like certain
primitives, like bezier lines. Be sure to convert everything to mesh before
export.

##### Memory limits
Due to current Chromium restrictions, any file that would be greater than
around 1.8GB uncompressed (around 170MB compressed) cannot be uncompressed (the
loader aborts and logs an error). There are work-arounds, but these avoid the
core issue. 1.8GB is around 15 million verts, which runs at 40FPS on a 2080TI
(not to mention horrendous loading times). As a general rule of thumb, a scene
shouldn't exceed 1 million verts.

Where keeping under 1 million verts is possible:
* A small to medium sized spaceship. Subtle details can be replaced with
normal maps, bevels with more than 2 divisions can't be seen anyway, subsurf
modifiers should have geo cleaned up with tools like hardops, etc.

Where keeping under 1 million verts is *not* possible:
* A large map, perhaps with many detailed buildings. In this cased the solution
is to split the file into smaller ones and use LODs to remove verts that are
far away. Instead of distributing the map (or ginormous space station) as a
single file, you then instead distribute it as a directory. That way the entire
scene in all its glory can be loaded into the scene with, hopefully, less than
a million verts. Note that slightly going over 1m isn't a problem in and of
itself, but rather something we should work hard to avoid.

### Legal crap

##### Using assets with different licenses
Please do not use anything that is incompatible with MIT. BSD is an example of a
compatible license.

_Some_ CC licenses are compatible. Look for licenses that:
* May be used commercially.
* Allows modification.
* Allows distribution.
* Allows private use.

GPL is incompatible and GPL licensed assets may not be used with this project.
If in doubt, do not use the asset at all (or consider raising an issue asking
for clarification).

##### Attribution
Include a license file with every asset (it should be in the same directory).
The license file's name should match the asset name. For example, a mesh named
`spaceship1.gltf` should be accompanied by a file named `spaceship1.license`.
If you have 10 spaceship meshes with the same name + a number and they share the
same license, you may name the license file something like `spaceship{1..10}.license`
or `spaceshipN.license` and then specify in the license file itself which files it
covers. In case numbers aren't used, the `_ALL` suffix may be used; the license file
then specifies the files covered. License files are not optional, and while
contributions truly are very much appreciated, we cannot accept additions that lack
license indications.

If you're making an asset specially for this project and don't want to worry
about legalities, feel free to simply put something like this in the license
file:
```text
This model is original work made for the Cosmosis project, and follows the
same MIT license.

@author Your Name
[etc]
```
Ultimately, you may make the license and attribute your work any which way you
please so long as it's MIT compatible and comes with a license file as
described above.

## Art style
If you're an artist who'd like to contribute to the game, welcome to the
project! All help is highly appreciated, and much needed. Please note that all
art for this game falls under MIT (or compatible), which basically means it's
public domain. You may still however request to be credited, and you're
encouraged to do so.

Please [raise an issue](https://github.com/feynmansbongos/Cosmosis/issues/new/choose)
before starting work. This game's art style has a very specific direction. Even
if you create art much better than what's already in the project, it might
simply be rejected on the basis that it does not match existing style. Once
direction has been agreed upon, follow the [asset submission process](page does not exist yet)
to get your work into the production builds.

## Music style
Unlike with visual art, any music style goes because the user can pick and
choose what they want. As with all assets, music donated to this project falls
under the MIT license, which basically means it's public domain. []

## Voice packs
Anyone who can donate their voice probably should :). Submission details TBA.
[]

## Programming

### Development
* Please use [official Node.js sources](https://nodejs.org/en/download/) to
install Node 10 or higher, LTS. On Windows the installer should ask if you'd
like to install Chocolatey and Python - say yes unless you have your own custom
setup.
* Install git. On Windows, it will ask you how you'd like to handle CR/LF. You
want any option that converts to Unix LF when committing; at time of writing
the default option does exactly the right thing.
* Please consider testing your changes on both Windows and Linux. It isn't
a strict requirement, but makes PRs to master easier for those who test the
proposed changes because some small issues will already have been caught.

### Git branch workflow

```
yourBranch-dev  -\
                   >  dev  ->  master  ->  stable
someoneElse-dev -/
```

Whenever you do work, create yourself a branch. You may either name the
branch after yourself, or after an issue you're working on. If naming it after
yourself, call it`yourName-dev`. If naming it after an issue, name it `CSM-xx`
where `xx` is the issue number. You'll want to pull from `master` often as it
is where all code ends up before making its way to `stable`.

Once you believe your work is stable and you're ready to release it, create a
pull request from `yourName-dev` to `dev`. Please indicate if anything you've
done introduces breaking changes (please avoid breaking changes if possible).
If you do introduce breaking changes, please mention it in the PR. Having to
change previously passing unit tests to make things work with your new code can
be an indication of a breaking change.

Every now and again, a pull request is created from `dev` to `master`. When
this happens, the version number is incremented. How the number is incremented
depends on whether or not breaking changes were introduced, if there were bug
fixes, etc. The project owners then test if the `master` branch appears to be
stable.

If the current `master` branch is considered stable, it will be merged into
`stable`, at which point your changes will make it into the latest release.

### Conventions
When creating an object that [] please try to define it somewhere with null
values. `core.js -> $game` and `[cam] -> ctrl` are examples of this.
This has 2 advantages:
* Any semi-decent IDE will produce full auto-completion and documentation.
* Other coders know what kind of structure to expect.

### Gotchas and problems

##### Three.js imports
Be careful when using the drei library. It has the incredibly annoying habit
of downloading sane defaults from the internet if you forget some function
parameters. This means that the game will work fine for days, just to then
crash and burn the moment your internet drops for a second. The crash will
happen for things as fundamental as mesh loading. When making changes involving
drei, please always test offline with cache disabled (Dev tools [Ctrl+Shift+I] -> Network -> Disable cache)
to ensure your changes aren't online-only.

### Setting up three.js auto-completion

A tutorial for VSCode is available here:
* http://shrekshao.github.io/2016/06/20/vscode-01/

Code dump:
```bash
We will use Typings to install these files.

Make sure you’ve installed node.js and run:

  npm install typings --global
Go to your project directory, run:

  typings init
There will be a typings.json file generated.

Now search for the three.js syntax file in DefinitelyTyped:

  typings search three
It will show all matched results. Find the one we need, the name is three

Install three

  typings install three --save --global
If this doesn’t work, try specify a domain for the typings, use this:
  typings install dt~three --save --global
Now with 1.x.x VSCode, we need to generate a jsconfig.json file in the root of the project folder by clicking the light bulb button at the bottom right.
```

For WebStorm, follow the above VSCode tutorial. By the time you reach the
VSCode-specific stuff, everything should already magically be working. If not:
* https://intellij-support.jetbrains.com/hc/en-us/community/posts/360000150644-Use-typescript-typings-for-javascript-code-completion

Code dump:
```bash
[...] Just add them to your project - this should normally be enough. Either
place them in your project folder, or add as Javascript libraries
(File | Settings | Languages & Frameworks | JavaScript | Libraries, Add...)
```
