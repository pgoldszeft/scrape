#!/bin/bash

echo $1

URL='http://pgoldszeft.hiring.keywee.io/stories'
ARG=$1

ID=$(curl -X POST -s $URL?url=$ARG)
echo $ID

META=$(curl -X GET -s $URL/$ID)
echo $META