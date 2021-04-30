## Compatibility
This game has been tested on Windows 10 build 1903. It has not been tested on
Linux yet (because rip graphics drivers), but any problems encountered would be
trivial to fix. This is because this project uses a standard nw.js / webpack
setup.

If you do encounter problems on Linux and would like to contribute a fix, feel
free to raise a PR.

## The lazy way
Head over to the releases page and download a pre-built copy. Done.

## By way of developer madness
Please ensure you have the following installed:
* git (tested with all install options default).
* npm (tested with 6.14, but any version should do).
* nodejs (tested with 12.18, but any version higher than 6 should do).

## Building the project
_Note: this project currently only has a dev webpack config. Feel free to raise
a PR with a prod webpack config._

Once you've cloned the project
(`git clone https://github.com/aggregate1166877/Cosmosis.git`)
you'll want to make sure all dependencies are installed:
```bash
npm install
```

If this is the very first time running the application, prepare the initial
bundle:
```bash
npm run prepare-dev
```

You can now start the application:
```bash
npm start
```
If all works as it should, you should see the game window pop up, refresh, and
find yourself in a space ship. Press 'J' to enter warp and start flying around.

## Production assets
Production assets are not be included with the source code. This is to keep it
as small as possible (git gets slow with large binary files, and GitHub has
horribly low file size limits).

To get the production assets, head over to the releases section and download
the 'Stand-Alone Production Assets.zip' package. You will see a folder named
'prodHqAssets'. Copy that into the same directory as this build document and
restart the game. The game will automatically load the better assets.

Note that some parts of the application (such as the planet loaders) do not yet
use the prod assets, so you will still see the low quality versions. This will
be fixed once development on planetary systems start.
