package main

type BravoError struct {
    code int
    zhMsg string
    err error
}

func NewBravoError(code int, err error) *BravoError {
    v := &BravoError{
        code: code,
        zhMsg: CodeMsgZH[code],
        err: err,
    }
    return v
}

func (v *BravoError) Error() string {
    if v.err == nil {
        return ""
    }
    return v.err.Error()
}

const (
    MaxActualDiff = 1000000
    ErrorSuccess = 0

    ErrorMysqlExecFailed = 104
    ErrorMaxErrorDiffToLittle = 105
)

var CodeMsgZH = map[int]string{
    ErrorSuccess:         "成功",
    ErrorMysqlExecFailed: "执行sql语句失败",
    ErrorMaxErrorDiffToLittle: "清理差值太小",
}