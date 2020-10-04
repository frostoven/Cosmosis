## Copyright infringement
**If your work has been unlawfully used in this project, please [raise an issue](https://github.com/aggregate1166877/SpaceJunkie/issues)
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

#### Mesh file formats
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

#### Legal crap

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
`spacehip1.gltf` should be accompanied by a file named `spaceship1.license`.
If you have 10 spaceship meshes with the same name + a number and they share the
same license, you may name the license file something like `spacehip{1..10}.license`
or `spaceshipN.license` and then specify in the license file itself which files it
covers. License files are not optional, and while contributions truly are very much
appreciated, we cannot accept additions that lack license indications.

If you're making an asset specially for this project and don't want to worry
about legalities, feel free to simply put something like this in the license
file:
```text
This model is original work made for the SpaceJunkie project, and follows the
same MIT license.

@author Your Name
[etc]
```
Ultimately, you may make the license and attribute your work any which way you
please so long as it's MIT compatible and comes with a license file as
described above.

## Programming gotchas and problems

#### Three.js imports
Be careful when using the drei library. It has the incredibly annoying habit
of downloading sane defaults from the internet if you forget some function
parameters. This means that the game will work fine for days, just to then
crash and burn the moment your internet drops for a second. The crash will
happen for things as fundamental as mesh loading. When making changes involving
drei, please always test offline with cache disabled (Dev tools [Ctrl+Shift+I] -> Network -> Disable cache)
to ensure your changes aren't online-only.

#### Setting up three.js auto-completion

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
