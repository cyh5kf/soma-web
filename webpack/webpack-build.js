/* eslint-env node */
var path = require('path'),
    webpack = require('webpack'),
    WebpackDevServer = require('webpack-dev-server'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    express = require('express'),
    ExpressHttpProxy = require('express-http-proxy'),
    ProgressBar = require('progress'),
    jsonStableStringify = require('json-stable-stringify'),
    autoprefixer = require('autoprefixer'),
    yargs = require('yargs'),
    fse = require('fs-extra'),
    WEBPACK_DIR = __dirname,
    ROOT_DIR = path.resolve(WEBPACK_DIR, '..'),
    SRC_DIR = path.resolve(ROOT_DIR, 'src'),
    exposeByPathLoader = require.resolve('./expose-by-path-loader');

var argv = yargs
    .alias('p', 'production')
    .alias('t', 'test')
    .argv;

var isDEV = !argv.production,
    isTest = !isDEV && !!argv.test,// 开启部分dev配置, 用于production环境下的测试
    saveStatsJson = !!argv['save-json'];

var isSourceMapEval = argv['sourceMapEval'];

var progressBar = null,
    progressModules = '';


var PORT = 3000;

function _rootPath(relativePath) {
    return path.resolve(ROOT_DIR, relativePath);
}

function _srcPath(relativePath) {
    return path.resolve(SRC_DIR, relativePath);
}


function getWebpackConfig(isDev) {
    isDev = !!isDev;
    var makeHotEntry = function (entries) {
            return (isDev ? [
                'webpack-dev-server/client?http://localhost:' + PORT + '/',
                'webpack/hot/only-dev-server' // "only" prevents reload on syntax errors
            ] : []).concat(entries);
        },
        makeStyleLoader = function (preCssLoader) {
            preCssLoader = preCssLoader ? ('!' + preCssLoader) : '';
            return isDev ? 'style!css!postcss' + preCssLoader : ExtractTextPlugin.extract('style', 'css!postcss' + preCssLoader);
        },
        outputFileName = isDev ? '[path][name].[ext]' : '[name].[hash].[ext]';
    return {
        entry: {
            app: makeHotEntry([
                _srcPath('./appMain.js')
            ])
        },
        devtool: isDev ? (isSourceMapEval?'eval-cheap-module-source-map':'cheap-module-source-map') : '',
        watch: isDev,
        output: {
            filename: isDev ? '[name].js' : '[name].[hash].js',
            path: _rootPath('build/static'),
            publicPath: '/static/'
        },
        module: {
            //noParse: /(moment|immutable)\.js$/,
            loaders: [
                {
                    test: /\Wpush\.js\W.*\.js$/i,
                    loader: 'imports?callback=>undefined'
                },
                {
                    test: /src.*\.(js|jsx)$/i,
                    loaders: isDev ? ['react-hot', exposeByPathLoader, 'babel'] : ['babel']
                },
                {
                    test: /\.json$/i,
                    loader: 'json'
                },
                {
                    test: /\.css$/i,
                    loader: makeStyleLoader()
                },
                {
                    test: /\.less$/i,
                    loader: makeStyleLoader('less')
                },
                {
                    test: /\.(png|jpg|jpeg|gif)$/i,
                    loader: 'url?limit=2000&name=' + outputFileName // 2K以下内联
                },
                {
                    test: /\.(mp3|eot|svg|ttf|woff|woff2)(\?.*)?/i,
                    loader: 'file?name=' + outputFileName
                }
            ]
        },
        resolve: {
            extensions: ['', '.js', '.jsx']
        },
        postcss: [
            autoprefixer({ browsers: ["Chrome > 20", "ie >= 10", "firefox >= 4", "last 2 versions"] })
        ],
        plugins: (isDev ? [
            new webpack.HotModuleReplacementPlugin()
        ] : [
            new ExtractTextPlugin('[name].[hash].css'),
            new webpack.optimize.UglifyJsPlugin({
                compress: {warnings: false} // 隐藏 UglifyJs 警告
            }),
            new webpack.optimize.OccurrenceOrderPlugin(),
            new webpack.optimize.DedupePlugin()
        ]).concat([
            new webpack.ProgressPlugin(function (percentage, msg) {
                if (!progressBar) {
                    progressBar = new ProgressBar('Building [:bar] :token_modules', {
                        width: 40,
                        total: 100,
                        complete: '=',
                        incomplete: ' '
                    });
                }
                progressBar.update(percentage, {
                    token_modules: msg.indexOf('modules') !== -1 ? (progressModules = msg) : progressModules
                });
            }),
            new webpack.DefinePlugin({
                __DEV__: isDev || isTest,
                'process.env.NODE_ENV': isDev ? '"development"' : '"production"'
            }),
            new HtmlWebpackPlugin({
                //favicon: _path('./static/favicon.png'),
                template: _srcPath('./index.html')
            })
        ])
    };
}

if (isDEV) {
    var webpackConfig = getWebpackConfig(true);
    var compiler = webpack(webpackConfig);

    var devServer = new WebpackDevServer(compiler, {
        hot: true,
        publicPath: webpackConfig.output.publicPath,
        contentBase: _srcPath('__NO_CONTENT_BASE__'),
        stats: {
            hash: false,
            version: false,
            assets: false,
            colors: true,
            chunks: true,
            chunkModules: false
        },
        proxy: {
            //'/upload/file3/upload/': {target:'http://ups-beta.soma.im'},
            '/upload': { target: 'http://beta.soma.im' }, // 文件上传路径
            '/soma*': { target: 'https://web.soma.im',changeOrigin: true, toProxy: true  }, // 文件上传路径
            '/filedown': { target: 'http://beta.soma.im', changeOrigin: true, toProxy: true } // 消息文件资源下载路径
        }
    });

    devServer.use('/static/3rd-party', express.static(_srcPath('3rd-party')));
    // 将除static资源路径外的其他路径都转到 index.html
    devServer.use(ExpressHttpProxy('localhost:3000', {
        forwardPath: function () {
            return '/static/index.html';
        }
    }));

    devServer.listen(PORT);
} else {
    fse.emptyDirSync(_rootPath('build'));
    webpack(getWebpackConfig(false), function (error, stats) {
        var jsonStats = stats.toJson();
        error = error || jsonStats.errors[0];
        if (saveStatsJson) {
            fse.writeFileSync(path.resolve(WEBPACK_DIR, 'webpack-stats.json'), jsonStableStringify(jsonStats, {space: 2}));
        }
        if (error) {
            console.error(error);
            process.exit(1);
        } else {
            fse.move(_rootPath('build/static/index.html'), _rootPath('build/index.html'), function (err) {
                if (err) {
                    console.log(err);
                    process.exit(1);
                } else {
                    console.log(stats.toString({
                        timings: true,
                        hash: false,
                        version: false,
                        assets: true,
                        colors: true,
                        chunks: true,
                        chunkModules: false,
                        children: false
                    }));
                }
            });
        }
    });
}
