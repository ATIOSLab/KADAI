#!/bin/sh
set -eu

node ./docker/wait-for-db.cjs

exec npm run bot:worker
