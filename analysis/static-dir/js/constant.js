var Errors = {};
Errors.Success = 0;
Errors.UIUnAuthoriezed = 401;
Errors.UINotFound = 404;

var links = {
    index: {
        mount: "/analysis"
    },
    analysis: {
        mount: "/analysis_bandwidth", link: "#/analysis_bandwidth",
        page: "views/analysis.html", controller: "CAnalysisBandwidth", text: "数据分析", icon: "glyphicon glyphicon-stats"
    }
};

var analysis_links = {
    bandwidth: {
        mount: "/analysis_bandwidth", link: "#/analysis_bandwidth",
        page: "views/analysis.html", controller: "CAnalysisBandwidth", text: "历史数据"
    }
};