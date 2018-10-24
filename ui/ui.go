package ui

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	"relative/model"

	"github.com/blkchain/blkchain"
	"github.com/gorilla/mux"
)

type Config struct {
	Assets http.FileSystem
	Babel  bool
}

func Start(cfg Config, m *model.Model, listener net.Listener) {

	server := &http.Server{
		ReadTimeout:    60 * time.Second,
		WriteTimeout:   60 * time.Second,
		MaxHeaderBytes: 1 << 16} // 64K

	root := mux.NewRouter()
	root.Handle("/", indexHandler(m, cfg.Babel))
	root.PathPrefix("/js/").Handler(http.FileServer(cfg.Assets))

	// /blocks/
	bsr := root.PathPrefix("/blocks").Subrouter().StrictSlash(true)
	bsr.Handle("/", blocksRedirHandler(m))
	bsr.Handle("/{height:[0-9]+}", blocksHandler(m))
	bsr.Handle("/{height:[0-9]+}/{limit:[0-9]+}", blocksHandler(m))

	// /block/<hash>
	br := root.PathPrefix("/block").Subrouter()
	br.Handle("/{hash:[a-fA-F0-9]+}", blockHandler(m))

	// /block/<hash>/txs/...
	tsr := br.PathPrefix("/{hash:[a-fA-F0-9]+}/txs").Subrouter().StrictSlash(true)
	tsr.Handle("/", txsRedirHandler(m))
	tsr.Handle("/{n:[0-9]+}", txsHandler(m))
	tsr.Handle("/{n:[0-9]+}/{limit:[0-9]+}", txsHandler(m))

	// /tx/<hash>
	tr := root.PathPrefix("/tx").Subrouter()
	tr.Handle("/{hash:[a-fA-F0-9]+}", txHandler(m))

	server.Handler = root
	go server.Serve(listener)
}

func indexHandler(m *model.Model, babel bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if babel {
			fmt.Fprintf(w, indexHTMLBabel)
		} else {
			fmt.Fprintf(w, indexHTML)
		}
	})
}

// This handler always redirects to a an immutable-content URL. The
// idea here is to make this content as cacheable as possible.
func blocksRedirHandler(m *model.Model) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		var l int
		ls := r.URL.Query()["limit"]
		if len(ls) > 0 {
			l, _ = strconv.Atoi(ls[0])
		}

		mh, err := m.SelectMaxHeight()
		if err != nil {
			log.Printf("blocksRedirHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		var url string
		if l > 0 {
			url = fmt.Sprintf("/blocks/%d/%d", mh, l)
		} else {
			url = fmt.Sprintf("/blocks/%d", mh)
		}

		http.Redirect(w, r, url, http.StatusFound)
	})
}

func blocksHandler(m *model.Model) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		hs := mux.Vars(r)["height"]
		h, _ := strconv.Atoi(hs)

		ls := mux.Vars(r)["limit"]
		l, _ := strconv.Atoi(ls)

		if l == 0 {
			l = 20
		}
		if l > 100 {
			l = 100
		}

		blocks, err := m.SelectBlocksJson(h, l)
		if err != nil {
			log.Printf("blocksHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		fmt.Fprint(w, "[")
		for i, block := range blocks {
			if i > 0 {
				fmt.Fprint(w, ",\n")
			}
			fmt.Fprint(w, block)
		}
		fmt.Fprint(w, "]\n")
	})
}

func blockHandler(m *model.Model) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		hashStr := mux.Vars(r)["hash"]
		hash, err := blkchain.Uint256FromString(hashStr)
		if err != nil {
			log.Printf("blockHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		block, err := m.SelectBlockByHashJson(hash)
		if err != nil {
			log.Printf("blockHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		fmt.Fprint(w, *block+"\n")
	})
}

// /block/<hash>/txs
// The UI doesn't need this, but might be convenient for human exploration.
func txsRedirHandler(m *model.Model) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		hashStr := mux.Vars(r)["hash"]
		hash, err := blkchain.Uint256FromString(hashStr)
		if err != nil {
			log.Printf("txsRedirHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		var l int
		ls := r.URL.Query()["limit"]
		if len(ls) > 0 {
			l, _ = strconv.Atoi(ls[0])
		}

		var url string
		if l > 0 {
			url = fmt.Sprintf("/block/%v/txs/0/%d", hash, l)
		} else {
			url = fmt.Sprintf("/block/%v/txs/0", hash)
		}

		http.Redirect(w, r, url, http.StatusFound)
	})
}

// /block/<hash>/txs/<start_n>[/<limit>]
func txsHandler(m *model.Model) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		hashStr := mux.Vars(r)["hash"]
		hash, err := blkchain.Uint256FromString(hashStr)
		if err != nil {
			log.Printf("blockHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		ns := mux.Vars(r)["n"]
		n, _ := strconv.Atoi(ns)

		ls := mux.Vars(r)["limit"]
		l, _ := strconv.Atoi(ls)

		if l == 0 {
			l = 20
		}
		if l > 100 {
			l = 100
		}

		txs, err := m.SelectTxsJson(hash, n, l)
		if err != nil {
			log.Printf("txsHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		fmt.Fprint(w, "[")
		for i, tx := range txs {
			if i > 0 {
				fmt.Fprint(w, ",\n")
			}
			fmt.Fprint(w, tx)
		}
		fmt.Fprint(w, "]\n")
	})
}

func txHandler(m *model.Model) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		hashStr := mux.Vars(r)["hash"]
		hash, err := blkchain.Uint256FromString(hashStr)
		if err != nil {
			log.Printf("txHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		tx, err := m.SelectTxByHashJson(hash)
		if err != nil {
			log.Printf("txHandler: %v", err)
			http.Error(w, "This is an error", http.StatusBadRequest)
			return
		}

		fmt.Fprint(w, *tx+"\n")

		// js, err := json.Marshal(block)
		// if err != nil {
		// 	log.Printf("blockHandler: %v", err)
		// 	http.Error(w, "This is an error", http.StatusBadRequest)
		// 	return
		// }

		// fmt.Fprint(w, string(js))
	})
}

const (
	// Remember that versions are also specified in package.json, you
	// must change them there as well as here for "make build"!
	cdnReact                = "https://unpkg.com/react@16.5.2/umd/react.production.min.js"
	cdnReactDom             = "https://unpkg.com/react-dom@16.5.2/umd/react-dom.production.min.js"
	cdnReactRouter          = "https://unpkg.com/react-router@4.3.1/umd/react-router.min.js"
	cdnReactRouterDom       = "https://unpkg.com/react-router-dom@4.3.1/umd/react-router-dom.min.js"
	cdnAxios                = "https://unpkg.com/axios@0.18.0/dist/axios.min.js"
	cdnReactBootstrap       = "https://unpkg.com/react-bootstrap@0.32.4/dist/react-bootstrap.min.js"
	cdnReactRouterBootstrap = "https://unpkg.com/react-router-bootstrap@0.24.4/lib/ReactRouterBootstrap.min.js"
	cdnBootstrapCss         = "https://unpkg.com/bootstrap@3.3.7/dist/css/bootstrap.min.css"

	cdnReactBootstrapTable    = "https://unpkg.com/react-bootstrap-table-next@1.3.0/dist/react-bootstrap-table-next.min.js"
	cdnReactBootstrapTableCss = "https://unpkg.com/react-bootstrap-table-next@1.3.0/dist/react-bootstrap-table2.min.css"
)

const indexHTML = `
<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="` + cdnBootstrapCss + `">
    <link rel="stylesheet" href="` + cdnReactBootstrapTableCss + `">
    <title>Blocks</title>
  </head>
  <body>
    <div id='root'></div>
    <script src="` + cdnReact + `"></script>
    <script src="` + cdnReactDom + `"></script>
    <script src="` + cdnReactRouter + `"></script>
    <script src="` + cdnReactRouterDom + `"></script>
    <script src="` + cdnReactBootstrap + `"></script>
    <script src="` + cdnReactRouterBootstrap + `"></script>
    <script src="` + cdnAxios + `"></script>
    <script src="` + cdnReactBootstrapTable + `"></script>
    <script src="js/app.js"></script>
  </body>
</html>
`

const indexHTMLBabel = `
<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="` + cdnBootstrapCss + `">
    <link rel="stylesheet" href="` + cdnReactBootstrapTableCss + `">
    <title>Bl&ouml;cks</title>
  </head>
  <body>
    <div id='root'></div>
    <script src="js/systemjs/system.js"></script>
    <script>
      SystemJS.config({
        map: {
          'plugin-babel': 'js/systemjs/plugin-babel.js',
          'systemjs-babel-build': 'js/systemjs/systemjs-babel-browser.js',
          'react': '` + cdnReact + `',
          'react-dom': '` + cdnReactDom + `',
          'react-router': '` + cdnReactRouter + `',
          'axios': '` + cdnAxios + `',
          'react-bootstrap': '` + cdnReactBootstrap + `',
          'react-router-dom': '` + cdnReactRouterDom + `',
          'react-router-bootstrap': '` + cdnReactRouterBootstrap + `',
          'react-bootstrap-table-next': '` + cdnReactBootstrapTable + `'
        },
        transpiler: 'plugin-babel',
        meta: {
          'js/*.js': { authorization: true },
          'js/*.jsx': {
            authorization: true,
            loader: 'plugin-babel',
            babelOptions: {
              react: true
            }
          }
        }
      });
      System.import('js/app.jsx');
    </script>
  </body>
</html>
`
