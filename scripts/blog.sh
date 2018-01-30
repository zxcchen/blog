#!/bin/bash

cd /opt/qiqiblog

NODE_ENV=production nohup node server/server.js 1>/tmp/blog.log 2>&1 &
