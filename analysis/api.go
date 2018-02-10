package main

import (
    "github.com/go-chi/chi"
    "net/http"
    "strconv"
    "fmt"
    "chnvideo.com/cloud/common/core"
)

type ApiData struct {}

func (v ApiData) Routes() chi.Router {
    r := chi.NewRouter()
    r.Get("/", v.List)
    r.Put("/clear", v.Clear)
    r.Route("/{id}", func(r chi.Router) {
    })
    return r
}

func (v ApiData)List(w http.ResponseWriter, r *http.Request)  {
    q := r.URL.Query()

    stTime, _ := strconv.ParseInt(q.Get("start_time"), 10, 64)
    endTime, _ := strconv.ParseInt(q.Get("end_time"), 10, 64)

    buy_option := q.Get("buy_option")
    per, _ := strconv.ParseInt(q.Get("diff_per"), 10, 64)
    master_min, _ := strconv.ParseInt(q.Get("master_min"), 10, 64)
    slave_min, _ := strconv.ParseInt(q.Get("slave_min"), 10, 64)
    set_diff_start, _ := strconv.ParseInt(q.Get("set_diff_start"), 10, 64)
    set_diff_end, _ := strconv.ParseInt(q.Get("set_diff_end"), 10, 64)
    actual_diff_start, _ := strconv.ParseInt(q.Get("actual_diff_start"), 10, 64)
    actual_diff_end, _ := strconv.ParseInt(q.Get("actual_diff_end"), 10, 64)

    fmt.Println("set diff start", set_diff_start, "end=", set_diff_end)
    set_diff_search := &DiffSearch{}
    if set_diff_start != 0 || set_diff_end != 0 {
        set_diff_search.valid = true
        set_diff_search.start = set_diff_start
        set_diff_search.end = set_diff_end
    }

    fmt.Println("actual diff start", actual_diff_start, q.Get("actual_diff_start"), "end=", actual_diff_end, q.Get("actual_diff_end"))
    actual_diff_search := &DiffSearch{}
    if actual_diff_start != 0 || actual_diff_end != 0 {
        actual_diff_search.valid = true
        actual_diff_search.start = actual_diff_start
        actual_diff_search.end = actual_diff_end
    }

    sources, err := DbSourcesAll(buy_option, stTime, endTime, per, master_min, slave_min, set_diff_search, actual_diff_search)
    if err != nil {
        Error(err).ServeHTTP(w, r)
        return
    }

    Data(sources).ServeHTTP(w, r)
}

func (v ApiData) Clear(w http.ResponseWriter, r *http.Request) {
    q := r.URL.Query()
    max_actual_diff, _ := strconv.ParseInt(q.Get("max_actual_diff"), 10, 64)
    if max_actual_diff < MaxActualDiff {
        err := fmt.Errorf("max actual diff too little, %v < %v", max_actual_diff, MaxActualDiff)
        core.LoggerError.Println(err.Error())
        Error(NewBravoError(ErrorMaxErrorDiffToLittle, err)).ServeHTTP(w, r)
        return
    }

    count, err := DbSourcesClear(max_actual_diff)
    if err != nil {
        Error(err).ServeHTTP(w, r)
        return
    }

    data := &struct {
        Count int64 `json:"count"`
    }{count}
    Data(data).ServeHTTP(w, r)
}