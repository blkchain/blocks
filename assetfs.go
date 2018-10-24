// Fake assetfs symbol satisfaction. Does not build when the
// builtin-assets tag is specified.

// +build !builtinassets

package main

import (
	"fmt"
	"log"
	"os"
)

func Asset(name string) ([]byte, error) {
	log.Printf("Stub Asset() called, this is not supposed to happen!")
	return nil, fmt.Errorf("Asset %s not found", name)
}

func AssetInfo(name string) (os.FileInfo, error) {
	log.Printf("Stub AssetInfo() called, this is not supposed to happen!")
	return nil, fmt.Errorf("AssetInfo %s not found", name)
}

func AssetDir(name string) ([]string, error) {
	log.Printf("Stub AssetDir() called, this is not supposed to happen!")
	return nil, fmt.Errorf("Asset %s not found", name)
}
