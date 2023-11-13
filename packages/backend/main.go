package main

import (
	"fmt"
	"net/http"
	"os"

	"rsc.io/quote/v4"
)

func main() {
	http.HandleFunc("/", echoHello)
	http.HandleFunc("/healthz", health)
	http.HandleFunc("/quote", echoQuote)
	http.HandleFunc("/envs", echoEnviron)
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
