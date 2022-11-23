
ASSETS_SRC = "assets"
ASSETS_GEN = "assets_gen"
WEBPACK_ENTRY = "app=${ASSETS_SRC}/js/app.jsx"

.PHONY: all help

all: help

help:
	@echo "Valid commands:"
	@echo "  make build: Compile with assets baked in"
	@echo "  make test: Run tests"

build: compile_js
	@export GOPATH=$${GOPATH-~/go} && \
	go install github.com/go-bindata/go-bindata/go-bindata@latest && \
	go-bindata -o bindata.go -tags builtinassets ${ASSETS_GEN}/... && \
	go build -tags builtinassets -ldflags "-X main.builtinAssets=${ASSETS_GEN}"

compile_js: node_modules/.dirstamp
	@rm -rf ${ASSETS_GEN} && mkdir -p ${ASSETS_GEN}/css ${ASSETS_GEN}/images ${ASSETS_GEN}/login ${ASSETS_GEN}/admin && \
#	cp -r ${ASSETS_SRC}/css/*.css ${ASSETS_GEN}/css && \
	./node_modules/.bin/webpack ${WEBPACK_ENTRY} --config webpack.config.js --optimize-minimize --output-path ${ASSETS_GEN}/js

node_modules/.dirstamp:
	@npm install && touch $@

test:
	@go test ./...

bitcoinjs_lib: ${ASSETS_SRC}/js/bitcoin.js

${ASSETS_SRC}/js/bitcoin.js:  node_modules/.dirstamp
	@./node_modules/.bin/browserify ${ASSETS_SRC}/js/bitcoinjs-config.js -s bitcoinjs > ${ASSETS_SRC}/js/bitcoin.js
