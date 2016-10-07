#!/bin/sh

# Stop the app server
node_modules/.bin/forever -a -m 10 stopall
