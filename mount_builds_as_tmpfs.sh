#!/bin/sh

# This scripts turns the project's build dirs into RAM disks (or tmpfs, to be
# precise) so we don't constantly hammer the disk with megabytes of data.
#
# Please run this script with elevated privileges.
#
# To undo the effects of this script, run the following with elevated
# privileges:
# umount client/.build
# umount server/.build

# Ensure the user has specified their desired user.
if test -z "$1"; then
  printf 'Please specify which user should have access to these directories.\n'
  printf 'Example Usage:\n'
  printf '  sudo ./mount_builds_as_tmpfs.sh my-normal-user\n'
  exit 0
fi

# Save arg1 as
user="$1"

# Exit if an error is encountered below.
set -ue

printf 'Creating tmpfs mount\n'
sudo mount -o size=32M -t tmpfs none build

printf 'Assigning ownership\n'
chown "$user":"$user" build

printf 'Setting permissions\n'
chmod 750 build

printf 'Done\n'
