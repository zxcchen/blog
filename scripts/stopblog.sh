#!/bin/bash

pid=`ps -ef |grep "node server/server.js"|grep -v "grep" |awk -F' ' '{printf("%s\n",$2)}'`

kill -9 $pid

if [ $? -eq 0 ];then
	echo "service stopped"
else
	echo "failed."
fi
