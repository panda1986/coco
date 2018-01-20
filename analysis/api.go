package main

import (
    "github.com/go-chi/chi"
    "net/http"
    "strconv"
)

type ApiData struct {}

func (v ApiData) Routes() chi.Router {
    r := chi.NewRouter()
    r.Get("/", v.List)
    r.Route("/{id}", func(r chi.Router) {

    })
    return r
}

func (v ApiData)List(w http.ResponseWriter, r *http.Request)  {
    q := r.URL.Query()

    stTime, _ := strconv.ParseInt(q.Get("start_time"), 10, 64)
    endTime, _ := strconv.ParseInt(q.Get("end_time"), 10, 64)

    sources, err := DbSourcesAll(stTime, endTime)
    if err != nil {
        Error(err).ServeHTTP(w, r)
        return
    }

    Data(sources).ServeHTTP(w, r)
}