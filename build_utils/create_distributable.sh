#!/bin/sh

# === Preparation =========================================================== #

# Enforces POSIX correctness (somewhat). Also known as POSIX_ME_HARDER.
export POSIXLY_CORRECT=1

echo "====================="
echo "Cosmosis build script"
echo "====================="
echo

# We need exactly one arg. Look for it.
if test -z "$1"; then
  echo '================================================================================'
  echo 'Please specify the directory containing the NW.js folder. Example:'
  echo "  $0 nw-extracted/nw-version/"
  echo '================================================================================'
  exit 1
fi

# Get absolute required paths. Error checking not done here, but further down.
nw_path="$(readlink -f "$1")"
cosmosis_path="$(readlink -f "./Cosmosis")"
prod_assets="$(readlink -f "./Stand-Alone.Production.Assets")"
dist_name='Cosmosis-win-x64'
    # ^^  TODO: generate this instead of hardcoding.
dist_path="$(readlink -f "./$dist_name")"

# === Set shell behaviour =================================================== #

# Abort on any non-zero code (usually indicated error).
set -e

# Disable globbing. This means that things like `ls *` will treat "*' as a file
# name instead of a wildcard.
set -f

# === Look for obvious problems ============================================= #

# Make paths `find`-friendly. We need to do that because we merge directory
# trees during the actual build.
nw_path="$(realpath --relative-to="." "$nw_path")"
cosmosis_path="$(realpath --relative-to="." "$cosmosis_path")"
prod_assets="$(realpath --relative-to="." "$prod_assets")"

test -d "$nw_path" || (
  echo "Cannot proceed: NW.js dir missing. Usually looks like: nwjs-sdk-[VERSION]-[PLATFORM]"
  echo "Have a look at CONTRIBUTING.md for build instructions."
  exit 1
)

test -d "$cosmosis_path" || (
  echo 'Cannot proceed: Cosmosis clone dir using unexpected name. Should be named: "Cosmosis"'
    echo 'Have a look at CONTRIBUTING.md for build instructions.'
    exit 1
)

test -d "$prod_assets" || (
  echo 'Cannot proceed: Prod assets dir missing. Should be named: "Stand-Alone.Production.Assets"'
    echo 'Have a look at CONTRIBUTING.md for build instructions.'
    exit 1
)

test -d "$dist_path" && (
  echo "Cannot proceed: a directory named '$dist_name' already exists. Please delete it and try again."
  echo "Have a look at CONTRIBUTING.md for build instructions."
  exit 1
)

# === Print pre-build report ================================================ #

is_windows=false

platform="$(uname | tr '[:upper:]' '[:lower:]')"
case "$platform" in
msys*) is_windows=true ;;
cygwin*) is_windows=true ;;
esac

echo "Build script will use the following paths:"
echo " * NW.js path: $nw_path"
echo " * Cloned Cosmosis path: $cosmosis_path"
echo " * Prod assets path: $prod_assets"
echo " * Build path: $$dist_path"
echo

[ $is_windows = true ] \
  && echo "Environment is: Windows" \
  || echo "Environment is a Unix variant"
echo

# === Start ================================================================= #

echo "=============="
echo "Starting build"
echo "=============="
echo

echo "* Create dist directory: $dist_path"
mkdir -p "$dist_path"

echo "* Merge source dirs into build dir"

echo "  > Cosmosis dir"
cd "$cosmosis_path"  >/dev/null
find . -type d -exec mkdir -p "$dist_path/{}" ';'
find . -type f -exec cp -a '{}' "$dist_path/{}" ';'
cd -  >/dev/null

echo "  > NW.js dir"
cd "$nw_path"  >/dev/null
find . -type d -exec mkdir -p "$dist_path/{}" ';'
find . -type f -exec cp -a '{}' "$dist_path/{}" ';'
cd -  >/dev/null

echo "  > Prod assets dir"
cd "$prod_assets"  >/dev/null
find . -type d -exec mkdir -p "$dist_path/{}" ';'
find . -type f -exec cp -a '{}' "$dist_path/{}" ';'
cd -  >/dev/null

echo

# Yes, this is needed even in Windows (especially in Windows). Some translation
# happens somewhere in cygwin that makes windows actually respect permissions,
# and `cp -a` above for some reason does not preserve them. 750 is a safe
# blanket set.
echo "* Recursively set build dir permissions to 750 on '$dist_path'"
chmod -R 750 "$dist_path"

echo "* Move to Cosmosis dir"
cd "$dist_path"  >/dev/null

# The 'nw' package is huge, takes long to download, and not at all used during
# the build process (even if it is used extensively during development). Remove
# it from package.json. Hopefully it never breaks file syntax (unlikely) - in
# which case npm will complain and angrily exit.
echo "* Removing line 'nw' from package.json to speed up build."
sed -i.bak '/"nw":/d' ./package.json >/dev/null

echo "* Installing build tools with 'npm install'"
npm install
echo

echo "* Build the game from source"
npm run prepare-dev
echo "  > Build complete"
echo

echo "* Remove tools used to build game"
npm prune --production
echo

# If Windows, rename exe.
[ $is_windows = true ] && (
  echo "* Rename nw.exe to Cosmosis.exe"
  mv nw.exe Cosmosis.exe
)

# If Unix, rename bin.
[ $is_windows = false ] && (
  echo "* Rename nw to Cosmosis"
  mv nw Cosmosis
)

# Most things are now bundled into build/game.js, so keeping them around
# doesn't make much sense.
echo "* Remove files not needed to run final product."
# Directories
rm -rf .git .github app build_utils
# Files
rm build/.gitkeep .gitignore .npmrc package-lock.json webpack.config.js

echo
echo
echo "===================="
echo 'Build has completed!'
echo "===================="
echo
echo "Please take the time to ensure the game is actually running correctly "
echo "before uploading the release."
echo
echo "You may do so as follows: "
echo "1) Start the Cosmosis application."
echo "2) Press F12 and make sure there are no errors in the developer console."
echo "3) From the developer console, run: powerOnSelfTest(). This runs unit "
echo "   tests. You should have no errors."
[ $is_windows = true ] &&
  echo "4) If all is good, zip it up, rename the zip to Cosmosis-win-x64.zip"
[ $is_windows = false ] &&
  echo "4) If all is good, zip it up, rename the zip to Cosmosis-$(platform)-x64.zip"
echo "5) Publish zip."
echo
