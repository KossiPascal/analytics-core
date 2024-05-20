#!/bin/bash

set -e

# echo "copy-ngsw: start ..."
# rm api/ngsw.json
touch api/ngsw.json
cat views/ngsw.json >> api/ngsw.json

# echo "copy-ngsw: done"
