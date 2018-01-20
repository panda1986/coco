package main

import (
    "os"
    "flag"
    "fmt"
    "log"
    "chnvideo.com/cloud/common/core"
    "github.com/go-chi/chi"
    "github.com/go-chi/chi/middleware"
    "strings"
    "net/http"
)

const (
    Version = "2.0"
)

// FileServer conveniently sets up a http.FileServer handler to serve
// static files from a http.FileSystem.
func FileServer(r chi.Router, path string, root http.FileSystem) {
    if strings.ContainsAny(path, "{}*") {
        panic("FileServer does not permit URL parameters.")
    }

    fs := http.StripPrefix(path, http.FileServer(root))

    if path != "/" && path[len(path)-1] != '/' {
        r.Get(path, http.RedirectHandler(path+"/", 301).ServeHTTP)
        path += "/"
    }
    path += "*"

    r.Get(path, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fs.ServeHTTP(w, r)
    }))
}

func run() int {
    cfg := flag.String("c", "analysis.conf", "configuration file")
    version := flag.Bool("v", false, "show version")

    flag.Parse()

    if *version {
        fmt.Println(Version)
        return 0
    }

    if err := ParseConfig(*cfg); err != nil {
        log.Fatalf("parse config failed, err is %v", err)
        return -1
    }

    // start reload listen goroutine.
    go core.StartReload(func() (err error) {
        if err = ParseConfig(*cfg); err != nil {
            return
        }
        core.LoggerWarn.Println(fmt.Sprintf("signal call to reload config success"))
        return
    })

    work := func() (err error) {
        core.LoggerTrace.Println(fmt.Sprintf("apply listen:%v", Config().Listen))

        if err = DbInit(Config()); err != nil {
            core.LoggerError.Println(fmt.Sprintf("open mysql failed, err is:%v", err))
            return
        }
        defer DbClose()

        r := chi.NewRouter()
        r.Use(middleware.RequestID)
        r.Use(middleware.RealIP)
        r.Use(middleware.Logger)
        r.Use(middleware.Recoverer)
        FileServer(r, "/", http.Dir("static-dir"))

        r.Mount("/api/v1.0/data", ApiData{}.Routes())
        listen := fmt.Sprintf("0.0.0.0:%v", Config().Listen)
        core.LoggerTrace.Println(fmt.Sprintf("listen at:%v", listen))
        if err = http.ListenAndServe(listen, r); err != nil {
            core.LoggerError.Println(fmt.Sprintf("http serve at:%v failed, err is:%v", Config().Listen, err))
            return
        }

        return
    }

    return core.ServerRun(&Config().Config, func() int {
        if err := work(); err != nil {
            return -1
        }
        return 0
    })
}

func main()  {
    os.Exit(run())
}
