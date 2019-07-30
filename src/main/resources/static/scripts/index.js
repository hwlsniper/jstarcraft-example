// 配置
var apiDomain = 'http://127.0.0.1:8080'; // api域名
var apiUrl = {
    getUsers: apiDomain + '/movies/getUsers', // 获取用户api地址
    recommend: apiDomain + '/movies/getRecommendItems', // 推荐api地址
    search: apiDomain + '/movies/getSearchItems', // 搜索api地址
    click: apiDomain + '/movies/click', // 点击api地址
};

var pageSize = 10; // 每页显示多少部电影
var columns = 5; // 一列显示多少部电影

var algorithms = [
    {
        name: 'MostPopular',
        value: 'MostPopular',
    },
    {
        name: 'ItemKNN',
        value: 'ItemKNN',
    },
    {
        name: 'UserKNN',
        value: 'UserKNN',
    }
];


var Status = {
    ready: 'ready', // 初始化
    loading: 'loading', // 加载中
    success: 'success', // 成功
    error: 'error', // 失败
};

var cacheData = []; // 缓存数据,用于前端分页

new Vue({
    el: '#container',
    data: {
        isShow: false, // 是否已初始化,防止一进来看到页面乱码
        type: 'search', // 类型(search:搜索 recommend:推荐)
        columns: columns, // 一列显示多少部电影
        users: {
            isShow: false,  // 是否显示用户下拉列表
            content: [],
            index: -1
        },
        algorithms: {
            isShow: false,  // 是否显示算法下拉列表
            content: algorithms,
            index: -1
        },
        // 推荐
        keyword: '', // 搜索关键字
        // 搜索结果
        data: {
            pageIndex: 1, // 当前是第几页
            pageCount: 1, // 总共有多少页
            content: [], // 数据
            style: {},
            status: Status.ready
        }
    },
    mounted: function () {
        // 获取页面链接
        this.initialize();
    },
    methods: {
        // 初始化
        initialize: function () {
        	var element = this;
            // 获取链接参数
            var parameters = this.getParameters(location.search);
            if (parameters && parameters.type) {
                this.type = parameters.type;
            }
            this.isShow = true;
            this.getUsers();
            document.addEventListener('click', function (event) {
                var className = event.target.getAttribute('class');
                if (className && className.indexOf('dropdown-toggle') !== -1) {
                	return;
                }
                element.algorithms.isShow = false;
            	element.users.isShow = false;
            });
        },
        // 点击(电影)
        click: function (itemId) {
            var data = {};
            if (this.users.index !== -1) {
                data.userIndex = this.users.content[this.users.index].id;
            }
            data.itemIndex = itemId;
            var query = {
                method: "GET",
                url: apiUrl.click,
                dataType: "json",
                data: data
            };
            $.ajax(query);
        },
        // 获取用户
        getUsers: function () {
            var element = this;
            // 请求参数
            var data = {};
            var query = {
                method: "GET",
                url: apiUrl.getUsers,
                dataType: "json",
                data: data
            };
            $.ajax(query).done(function (data) {
            	element.users.content = data.content;
            }).fail(function () {
            });
        },
        // 获取物品(电影)
        getItems: function () {
            var element = this;

            // 请求参数
            var request;
            if (this.type === 'recommend') {
                // 判断是否选择了算法
                if (this.algorithms.index === -1) {
                    alert('请先选择推荐算法');
                    return;
                }
                // 推荐
                request = {
                    recommendKey: this.algorithms.content[this.algorithms.index].value
                };
            } else {
                // 搜索
            	request = {
                    searchKey: this.keyword
                };
            }
            if (this.users.index !== -1) {
            	request.userIndex = this.users.content[this.users.index].id;
            }
            var query = {
                method: "GET",
                url: this.type === 'search' ? apiUrl.search : apiUrl.recommend,
                dataType: "json",
                data: request
            };
            
            var response = this.data;
            response.status = Status.loading;
            response.pageIndex = 1;
            response.content = [];
            response.style = {};
            $.ajax(query).done(function (data) {
                cacheData = data.content;
                element.data.pageCount = Math.ceil(cacheData.length / pageSize);
                element.showPage(response.pageIndex);
                element.data.status = Status.success;
            }).fail(function () {
            	element.data.status = Status.error;
            });
        },
        // 显示下拉框(算法)
        showAlgorithms: function () {
            this.algorithms.isShow = true;
        },
        // 选择(算法)
        selectAlgorithms: function (index) {
            this.algorithms.index = index;
        },
        // 显示下拉框(用户)
        showUser: function () {
            this.users.isShow = true;
        },
        // 选择(用户)
        selectUser: function (index) {
            this.users.index = index;
        },
        getParameters: function (query) {
            if (query) {
                var index = 0;
                if (query.indexOf('?') !== -1) {
                    index = 1;
                }
                var parameters = {};
                query.substr(index).split('&').forEach(item => {
                    var keyValue = item.split('=');
                    parameters[keyValue[0]] = keyValue[1];
                });
                return parameters;
            }
            return null;
        },
        // 显示对应的页数
        showPage: function (page) {
            // 取第几页显示
            var length = this.data.content.length;
            if (length < page) {
                var array = cacheData.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
                this.data.content.push(array);
            }
            this.data.pageIndex = page;
            // 计算位移
            var delta = -(page - 1) * 100;
            var translate = `translate(${delta}%,0)`;
            var style = {
                transform: translate,
                webkitTransform: translate,
            };
            this.data.style = style;
        },
        // 上一页
        prevPage: function () {
            if (this.data.pageIndex > 1) {
                this.showPage(this.data.pageIndex - 1);
            }
        },
        // 下一页
        nextPage: function () {
            if (this.data.pageIndex < this.data.pageCount) {
                this.showPage(this.data.pageIndex + 1);
            }
        }
    }
});