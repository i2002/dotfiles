#!/bin/bash
awk 'BEGIN { RS = " "; FS = "=" } $1 == "prime_discrete" { print $2 }' /proc/cmdline | sed -n -e 's/"//g;1p' > /etc/prime-discrete
