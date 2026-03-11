#!/bin/bash

CSV_FILE=$1
ANDROZOO_BASE="http://androzoo.uni.lu/api/download"
API_KEY="ANDROZOO_API_KEY"

while IFS=, read -r hash score
do
    if [[ "$hash" == "sha256" ]]; then
        continue
    fi

    echo "Downloading App: $hash"
    axel -n 12 "$ANDROZOO_BASE?apikey=$API_KEY&sha256=$hash"

    python3 a.py $hash.apk

    rm $hash.apk
done < $CSV_FILE
