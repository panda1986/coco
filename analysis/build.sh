#!/bin/bash

# calc the dir
echo "argv[0]=$0"
if [[ ! -f $0 ]]; then
    echo "directly execute the scripts on shell.";
    work_dir=`pwd`
else
    echo "execute scripts in file: $0";
    work_dir=`dirname $0`; work_dir=`(cd ${work_dir} && pwd)`
fi

objs=$work_dir/objs
release=$objs/_release
mkdir -p $objs
echo "work_dir: $work_dir"
echo "objs: $objs"
echo "release: $release"

function go_platform()
{
    # for go api
    go_blog="http://blog.csdn.net/win_lin/article/details/40618671"
    # check go
    go help >/dev/null 2>&1
    ret=$?; if [[ 0 -ne $ret ]]; then echo "go not install, see $go_blog. ret=$ret"; exit $ret; fi
    echo "go is ok"
    # check GOPATH
    if [[ -d $GOPATH ]]; then
        echo "GOPATH=$GOPATH";
    else
        echo "GOPATH not set.";
        echo "see $go_blog.";
        exit -1;
    fi
    echo "GOPATH is ok"
}

function build_coco_analysis()
{
    if [[ ! -d $GOPATH/src/chnvideo.com/cloud/coco_analysis ]]; then
        mkdir -p $GOPATH/src/chnvideo.com/cloud &&
        ln -sf $work_dir $GOPATH/src/chnvideo.com/cloud/coco_analysis
        ret=$?; if [[ 0 -ne $ret ]]; then echo "chnvideo.com/cloud/coco_analysis failed. ret=$ret"; exit $ret; fi
    fi
    echo "coco_analysis ok"

    go build -o objs/coco.anaysis chnvideo.com/cloud/coco_analysis
    ret=$?; if [[ 0 -ne $ret ]]; then echo "build coco.analysis failed. ret=$ret"; exit $ret; fi
    echo "build coco.analysis ok"
}

go_platform
build_coco_analysis

echo "* 启动cooc.analysis功能:"
echo "      go build -o objs/coco.analysis chnvideo.com/cloud/coco_analysis && ./objs/coco.analysis -c analysis.conf"
