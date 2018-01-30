#!/bin/bash

if (( $# != 2 ));then
	echo "usage:$0 [directory]"
	exit
fi

if [ -d $1 ];then
	cd $1
	mongoimport -d blog -c user --file user.sql
	mongoimport -d blog -c blogpost --file blogpost.sql
	if [ $? -eq 0 ];then
		echo "数据导入成功!"
	fi
fi


