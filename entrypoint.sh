#!/bin/sh
set -e

# Seed /appdata with defaults when the volume is empty.
if [ ! -f /appdata/config.yml ]; then
  mkdir -p /appdata
  cp -a /appdata.defaults/. /appdata/
fi

exec "$@"
