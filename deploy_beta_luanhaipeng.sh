#!/bin/sh
rsync -rave 'ssh -o ProxyCommand="/usr/bin/nc -X 5 -x 127.0.0.1:10087 %h %p" -p 58022 -i  /Users/luanhaipeng/.ssh/luan' --progress build/  luanhaipeng@10.109.111.254:/tmp/somaweb
