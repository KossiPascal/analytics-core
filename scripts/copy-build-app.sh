#!/bin/bash

set -e

echo "copy-build-app: start ..."
rm -rf api/build
mkdir -p api/build/webapp
cp -r dist/browser/* api/build/webapp/

echo "copy-build-app: done"