#!/bin/bash


# Function taken from
# https://stackoverflow.com/questions/296536/how-to-urlencode-data-for-curl-command


rawurlencode() {
  local string="${1}"
  local strlen=${#string}
  local encoded=""
  local pos c o

  for (( pos=0 ; pos<strlen ; pos++ )); do
     c=${string:$pos:1}
     case "$c" in
        [-_.~a-zA-Z0-9] ) o="${c}" ;;
        * )               printf -v o '%%%02x' "'$c"
     esac
     encoded+="${o}"
  done
  echo "${encoded}"    # You can either set a return variable (FASTER)
  REPLY="${encoded}"   #+or echo the result (EASIER)... or both... :p
}

echo $( rawurlencode "$1" )
URL='http://pgoldszeft.hiring.keywee.io/stories'
URL='http://localhost:3000/stories'
ARG=$1

ID=$(curl -X POST -s  $URL?url=$(rawurlencode $ARG))
echo $ID

sleep 3

META=$(curl -X GET -s $URL/$ID)
echo $META