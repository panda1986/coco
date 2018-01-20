package main

import (
    "chnvideo.com/cloud/common/core"
    "chnvideo.com/cloud/common/mysql"
    "fmt"
    "strings"
)

var DB *SqlServer

func DbInit(c mysql.SqlConfig) (error) {
    DB = NewSqlServer(c)
    return DB.Open()
}

func DbClose()  {
    DB.Close()
}

type SqlServer struct {
    Client *mysql.SqlClient
}

func NewSqlServer(c mysql.SqlConfig) *SqlServer {
    s := &SqlServer{}
    s.Client = mysql.NewSqlClient(c)
    return s
}

func (s *SqlServer) Open() error {
    return s.Client.Open()
}

func (s *SqlServer) Close() {
    s.Client.Close()
}

type QueryRow interface {
    Scan(dest ...interface{}) error
}

type AnaysisSourceData struct {
    Id int64 `json:"id"`
    CreateTime int64 `json:"create_time"`
    BuyOption string `json:"buy_option"`
    SetMaster int64 `json:"set_master"`
    SetSlave int64 `json:"set_slave"`
    ActualMaster int64 `json:"actual_master"`
    ActualSlave int64 `json:"actual_slave"`
    AccountValue int64 `json:"account_value"`
}

var SourceFileds = []string{"id", "create_time", "buy_option", "set_master", "set_slave", "actual_master", "actual_slave",
    "account_value"}
func (v *AnaysisSourceData) Scan(rows QueryRow) (err error) {
    if err = rows.Scan(&v.Id, &v.CreateTime, &v.BuyOption, &v.SetMaster, &v.SetSlave, &v.ActualMaster, &v.ActualSlave, &v.AccountValue); err != nil {
        core.LoggerError.Println("row scan task info failed, err is", err)
        return NewBravoError(ErrorMysqlExecFailed, err)
    }
    return
}

func DbSourcesAll(start_time int64, end_time int64) (sources []*AnaysisSourceData, err error) {
    sources = []*AnaysisSourceData{}
    query := fmt.Sprintf("select %s from analysis where create_time >= ? and create_time < ?", strings.Join(SourceFileds, ","))
    core.LoggerTrace.Println(fmt.Sprintf("select data, query=%v", query), start_time, end_time)
    rows, err := DB.Client.Query(query, start_time, end_time)
    if err != nil {
        core.LoggerError.Println("get tasks failed, query is", query, "err is", err)
        return sources, NewBravoError(ErrorMysqlExecFailed, err)
    }
    defer rows.Close()
    for rows.Next() {
        r := &AnaysisSourceData{}
        if err = r.Scan(rows); err != nil {
            core.LoggerError.Println("row scan task info failed, err is", err)
            return
        }
        sources = append(sources, r)
    }

    err = rows.Err()
    if err != nil {
        core.LoggerError.Println("not encounter the eof of the rows, err is", err)
        return sources, NewBravoError(ErrorMysqlExecFailed, err)
    }
    return
}