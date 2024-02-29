#!/usr/bin/env bash
set -e

ionic build --prod --release

cd ../deploy

if [ -d "public" ] 
then
    DATE_WITH_TIME=`date "+%Y%m%d-%H%M%S"`
    mv public $DATE_WITH_TIME    
fi

cp -rp ../ionic/www ./public

firebase deploy --only hosting:garage-monitor-edge
