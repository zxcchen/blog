#!/bin/bash


nohup mongod --dbpath=/opt/mongodb/data  1>/tmp/mongodb.log 2>&1 &
