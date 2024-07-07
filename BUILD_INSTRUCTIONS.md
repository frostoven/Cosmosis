## Compatibility

This game has been tested on Windows 10 build 1903, and Ubuntu Linux versions
18.04 and 20.04. Other operating systems should work with minimal effort
because this project uses a standard NW.js / webpack setup.

If you encounter problems with unofficial operating systems and would like to
contribute a fix, feel free to raise a PR.

## The lazy way

Head over to
[the releases page](https://github.com/frostoven/Cosmosis/releases)
and download a pre-built copy. Done.

## By way of developer madness

Please ensure you have the following installed:

* Git
* NPM
* Node.js

**Important notes regarding Node.js and NPM:**

* The build process currently only supports Node.js 16 and below. This is
  because webpack 4 uses an older version of SSL which
  [causes a fatal exception](https://stackoverflow.com/questions/69394632/webpack-build-failing-with-err-ossl-evp-unsupported)
  in Node.js. We'll fix this when time permits, but our current webpack setup
  isn't compatible with webpack 5, so it'll take some migration effort. Please
  use a tool such as NVM to downgrade your Cosmosis build environment for now.
* Alternatives to NPM such as PNPM and Yarn won't treat you very well. They've
  [taken a stance](https://github.com/pnpm/pnpm/issues/2891)
  on breaking compatibility with NPM which causes the NW.js installation to
  fail. This will be investigated at some point but is not a priority.

## Building the project

Once you've cloned the project
(`git clone https://github.com/frostoven/Cosmosis.git`)
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
find yourself in a spaceship.

Unit tests may be performed by pressing F12 and running `powerOnSelfTest()`.

## NPM scripts

The below table details all NPM scripts currently available.

| NPM Command           | Description                                                                                                                                                                                                          |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `npm start`           | Starts the developer build tool (Webpack) and runs the game (nw) in parallel. The game will reload as the the dev tool regenerates code (a reload always happens at least once after boot when running `npm start`). |
| `npm run start`       | Alias of `npm start`.                                                                                                                                                                                                |
| `npm run game`        | Launches the game without any background dev tools.                                                                                                                                                                  |
| `npm run prepare-dev` | Builds the game's source code and then exits. Built source is stored in `./build`.                                                                                                                                   |
| `npm run dev`         | Launches the dev tool without the game.                                                                                                                                                                              |

## Hot module reloading

HMR is enabled by default, though it currently causes a full application
reload. To disable HMR, press F12 to open the dev terminal and run:

```javascript
hmrDisabled = true;
```

This will disable HMR until you restart the application.

## Production assets

Production assets are not be included with the source code. This is to keep it
as small as possible (git gets slow with large binary files, and GitHub has
horribly low file size limits).

To get the production assets, head over to the
[releases section](https://github.com/frostoven/Cosmosis/releases) and
download the 'Stand-Alone Production Assets.zip' package. You will see a folder
named 'prodHqAssets'. Copy that into the same directory as this build document
and restart the game. The game will automatically load the better assets.

Note that some parts of the application (such as the planet loaders) do not yet
use the prod assets, so you will still see the low quality versions. This will
be fixed once development on planetary systems start.

## Creating a distributable game folder

Instructions below were written for Windows, but the same instructions will
work with Linux if you substitute obvious parts where appropriate. For example,
you may substitute `C:\\` with `/tmp`, `win32` with `linux`, `nw.exe` with
`nw`, etc. This project currently fully supports Windows and Linux, and build
scripts are maintained for both.

##### Requirements

Before starting, ensure you have all build requirements satisfied. This
includes a bash terminal with git available, and modern versions of node.js and
npm installed. See 'Development' above for more details.

##### Building the application

* Create a directory to work in, for example `C:\COSMOSIS_BUILDS` and open it.
* Open a bash terminal, and navigate to the builds directory you created above.
* Do a git clone of the repo, example `git clone https://github.com/frostoven/Cosmosis.git`
* Download the Windows SDK version of NW.js matching the version written in
  [package.json](package.json). At the time of writing, this is
  [NW.js version 0.55.0](https://nwjs.io/blog/v0.55.0/).
* Extract the zip contents ([7-Zip](https://www.7-zip.org/download.html) recommended as Windows ZIP can corrupt files).
* Download the latest `Stand-Alone Production Assets` zip from the [releases page](https://github.com/frostoven/Cosmosis/releases),
  and extract it into a directory named `Stand-Alone.Production.Assets`. `Stand-Alone.Production.Assets` should contain `prodHqAssets`.
* Your builds directory should now have these files / directories:
    * `Cosmosis`
    * `nwjs-sdk-v0.55.0-win-x64`
    * `Stand-Alone.Production.Assets`
    * `nwjs-sdk-v0.55.0-win-x64.zip`
    * `Stand-Alone.Production.Assets.zip`
        * _Note: you may delete the zip files if no longer needed._
* Back in your terminal, run `ls -1`. You should see the same files as above.
* Still in the bash terminal, you may now build the project by running the
  build script. It requires passing the NW.js download folder as its only argument.<br>
  Example:

```bash
./Cosmosis/build_utils/create_windows_distributable.sh nwjs-sdk-v0.55.0-win-x64/nwjs-sdk-v0.55.0-win-x64
```

The build script will copy the NW.js and Cosmosis folders into a new folder
named `Cosmosis-win-x64`. It will then install the needed build tools, build
the game, and perform cleanup.

##### Tests

Once all the above is complete, please run tests to ensure correct functioning:

* Run `Cosmosis.exe`. Press F12 and make sure there are no errors in the
  developer console.
* Still in the dev console, run: `powerOnSelfTest()`. This runs unit tests
  (i.e. looks for obvious bugs and problems). You should have no errors.
* If all is good, zip up FILL_ME_IN, rename the zip to `Cosmosis-win-x64.zip`.
* Upload to the [releases](https://github.com/frostoven/Cosmosis/releases)
  page.
