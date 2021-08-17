#!/bin/sh

# This script requires a POSIX compliant SH. On Windows, it was specifically
# written with Cygwin (mintty) in mind. Git for Windows is supported, too. WSL
# is untested and might fail.
#
# Script usage:
# ./create_distributable.sh nwjs_dir

# Enforces POSIX correctness (somewhat). Also known as POSIX_ME_HARDER.
export POSIXLY_CORRECT=1

# Sanity check.
if ! test -d Cosmosis; then
  echo 'You appear to be in the wrong directory.'
  echo 'Have a look at CONTRIBUTING.md for build instructions.'
  exit 1
fi

Cosmosis/build_utils/create_distributable.sh "$1" auto
