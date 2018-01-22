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
    SetDiff int64 `json:"set_diff"`
    SetMaster int64 `json:"set_master"`
    SetSlave int64 `json:"set_slave"`
    ActualDiff int64 `json:"actual_diff"`
    ActualMaster int64 `json:"actual_master"`
    ActualSlave int64 `json:"actual_slave"`
    State int `json:"state"`
    LastAccountValue int64 `json:"last_account_value"`
    AccountValue int64 `json:"account_value"`
}

var SourceFileds = []string{"id", "create_time", "buy_option", "set_diff", "set_master", "set_slave",
    "actual_diff", "actual_master", "actual_slave", "state", "last_account_value",
    "account_value"}
func (v *AnaysisSourceData) Scan(rows QueryRow) (err error) {
    if err = rows.Scan(&v.Id, &v.CreateTime, &v.BuyOption, &v.SetDiff, &v.SetMaster, &v.SetSlave,
        &v.ActualDiff, &v.ActualMaster, &v.ActualSlave, &v.State, &v.LastAccountValue, &v.AccountValue); err != nil {
        core.LoggerError.Println("row scan task info failed, err is", err)
        return NewBravoError(ErrorMysqlExecFailed, err)
    }
    return
}

type DiffSearch struct {
    valid bool
    start int64
    end int64
}

func DbSourcesAll(buy_option string, start_time int64, end_time int64, set_diff_search *DiffSearch, actual_diff_search *DiffSearch) (sources []*AnaysisSourceData, err error) {
    sources = []*AnaysisSourceData{}
    query := fmt.Sprintf("select %s from analysis where create_time >= ? and create_time < ?", strings.Join(SourceFileds, ","))
    args := []interface{}{}
    args = append(args, start_time, end_time)
    if len(buy_option) > 0 {
        if buy_option == "empty" {
            query += " and buy_option=?"
            args = append(args, "")
        } else if buy_option == "not_empty" {
            query += " and buy_option != ''"
        } else {
            query += " and buy_option = ?"
            args = append(args, buy_option)
        }
    }
    if set_diff_search.valid {
        query += " and abs(set_diff) > ? and abs(set_diff) <= ?"
        args = append(args, set_diff_search.start, set_diff_search.end)
    }
    if actual_diff_search.valid {
        query += " and abs(actual_diff) > ? and abs(actual_diff) <= ?"
        args = append(args, actual_diff_search.start, actual_diff_search.end)
    }
    core.LoggerTrace.Println(fmt.Sprintf("select data, query=%v", query), start_time, end_time)
    rows, err := DB.Client.Query(query, args...)
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

func DbSourcesClear(max_actual_diff int64) (count int64, err error) {
    query := "delete from analysis where actual_diff >= ? or set_diff >= ?"
    count, _, err = DB.Client.Exec(query, max_actual_diff, max_actual_diff)
    if err != nil {
        core.LoggerError.Println(fmt.Sprintf("delete sources actual_diff>=%v or set_diff>=%v failed, err is %v", max_actual_diff, max_actual_diff, err))
        return 0, NewBravoError(ErrorMysqlExecFailed, err)
    }

    return
}