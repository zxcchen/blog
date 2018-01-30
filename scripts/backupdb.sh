#!/bin/bash

mkdir -p backupdata
today=`date +%Y%m%d`
mkdir -p backupdata/$today
cd backupdata/$today
mongoexport -d blog -c user -o user.sql
mongoexport -d blog -c blogpost -o blogpost.sql
