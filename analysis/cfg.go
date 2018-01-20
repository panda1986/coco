package main

import (
    "chnvideo.com/cloud/common/core"
    "chnvideo.com/cloud/common/mysql"
    "fmt"
    "log"
    "os"
    "sync"
    "encoding/json"
)

type GlobalConfig struct {
    core.Config
    mysql.SqlCommonConfig
}

func (v *GlobalConfig) Validate() (err error) {
    if err = v.Config.Validate(); err != nil {
        log.Println(fmt.Sprintf("invalid config, err is:%v", err))
        return
    }
    return
}


func ParseConfig(cfg string) (err error) {
    if cfg == "" {
        log.Fatalln("use -c to specify configuration file")
    }

    var f *os.File
    if f, err = os.Open(cfg); err != nil {
        return
    }
    defer f.Close()

    ConfigFile = cfg

    var c GlobalConfig

    d := json.NewDecoder(f)
    if err = d.Decode(&c); err != nil {
        return
    }
    if err = c.Validate(); err != nil {
        return
    }

    lock.Lock()
    defer lock.Unlock()

    config = &c

    log.Println("read config file:", cfg, "successfully")
    return
}

var (
    ConfigFile string
    config     *GlobalConfig
    lock       = new(sync.RWMutex)
)

func Config() *GlobalConfig {
    lock.RLock()
    defer lock.RUnlock()
    return config
}