
Licensed under the Apache License, Version 2.0

Blocks is a block explorer in Go and React. It relies on code in
https://github.com/blkchain/blkchain which stores the blockchain in
PostgreSQL.

Blocks allows for browsing blocks, transactions therein and searching
by block id, tx id or addresses (including bech32). There is no
limitation on how many transactions reference an address.

This blog post describes the general idea of how this source code is
organized: https://grisha.org/blog/2017/04/27/simplistic-go-web-app/

To build the app, just run "go build" and run the resulting binary in
this directory. The assets will be served from the assets directory
and jsx is transpiled in the browser by babel.

You can also run "make build" which will pack all the assets into the
binary itself. After a "make build", the only file you need is the
binary itself.

Status: this code generally works, though the UI side leaves a lot to
be desired. Issues and PR's more than welcome.
