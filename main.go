package main

import (
	"flag"
	"log"
	"net/http"

	"relative/daemon"

	assetfs "github.com/elazarl/go-bindata-assetfs"
)

var (
	assetsPath    string
	builtinAssets string // -ldflags -X only works with strings
)

func processFlags() *daemon.Config {
	cfg := &daemon.Config{}

	flag.StringVar(&cfg.ListenSpec, "listen", "localhost:3000", "HTTP listen spec")
	flag.StringVar(&cfg.Db.ConnectString, "connstr", "host=/var/run/postgresql dbname=blocks sslmode=disable", "DB Connect String")
	flag.StringVar(&assetsPath, "assets-path", "assets", "Path to assets dir")

	flag.Parse()
	return cfg
}

// When we are baking in assets, builtinAssets is not blank (set via
// ldflags, see Makefile). Otherwise they are read from assetpath.
func setupHttpAssets(cfg *daemon.Config) {
	if builtinAssets != "" {
		log.Printf("Running with builtin assets.")
		cfg.UI.Assets = &assetfs.AssetFS{Asset: Asset, AssetDir: AssetDir, AssetInfo: AssetInfo, Prefix: builtinAssets}
	} else {
		log.Printf("Assets served from %q.", assetsPath)
		cfg.UI.Assets = http.Dir(assetsPath)
		cfg.UI.Babel = true
	}
}

func main() {
	cfg := processFlags()

	setupHttpAssets(cfg)

	if err := daemon.Run(cfg); err != nil {
		log.Printf("Error in main(): %v", err)
	}
}
