package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/lib/pq"
	"rsc.io/quote/v4"
)

func main() {
	http.HandleFunc("/", echoHello)
	http.HandleFunc("/healthz", health)
	http.HandleFunc("/quote", echoQuote)
	http.HandleFunc("/envs", echoEnviron)
	http.HandleFunc("/dbecho", echoDb)
	http.ListenAndServe(":8000", nil)
}

func echoHello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello World")
}

func health(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "ok")
}
func echoQuote(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, quote.Go())
}

func echoEnviron(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "")
	for _, e := range os.Environ() {
		fmt.Fprintln(w, e)
	}
}

func echoDb(w http.ResponseWriter, r *http.Request) {
	dburi := os.Getenv("SST_Parameter_value_DBURI")
	dataSource, err := pq.ParseURL(dburi)
	if err != nil {
		log.Fatalln("Failed to parse DBURI", err)
	}

	db, err := sql.Open("postgres", dataSource)
	if err != nil {
		log.Fatalln("Failed to connect", err)
	}
	defer db.Close()

	var version string
	if err := db.QueryRow("select version()").Scan(&version); err != nil {
		log.Fatalln(err)
	}
	fmt.Fprintln(w, "DB version", version)
}
