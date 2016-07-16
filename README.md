# [php2ts] The name of the solution to convert the source code written in PHP to TypeScript.

For my strength is exhausted , we decided to publish the source code.

These files do not have a scheduled update.

## Folder[php-server]
It is a server to parse the PHP syntax.

### Files
* server.php

It is a script to start the server.

* official_util.php

Copy of (https://github.com/nikic/php-ast) util.php

## Folder[src]
This script group to output the TypeScript.

That in the source code comments are Japanese , please forgive me.

## Folder[before_separate]
It is a project file before the separation of functions.

And cli.js to be used from the command line , there is a www.js to be used in the www.

## Install
1. npm install
1. cd src
1. tsc

## Execute
1. php.exe php-server/server.php
1. node.exe bin/p2t.js

## LICENCE
I myself will give up all of the rights.

However , the right relationship exists by the license of the sub- modules that are used in this project.
