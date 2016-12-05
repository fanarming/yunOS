var url = require('url');
var fs = require('fs');
var path = require('path');

var gulp = require('gulp');
var sass = require('gulp-sass');
var base64 = require('gulp-base64');
var autoprefix = require("gulp-autoprefixer");  //自动添加css前缀
var plumber = require('gulp-plumber');
var includeTpl = require("gulp-file-include");
//var browserSync = require('browser-sync');
var livereload = require('gulp-livereload');//自动刷新页面
var runSequence = require('gulp-run-sequence'); //顺序执行任务
var webserver = require('gulp-webserver'); //web服务器

var config = {
  options: {
    extensions: [/image\/base64\/([\s\S]*?)\.(png|jpg|PNG|JPG)/],
    maxImageSize: 80 * 1024,
    debug: false
  }
}

gulp.task('css', function(){
  return gulp.src('app/scss/**/*.scss')
    .pipe(plumber())
    .pipe(sass.sync().on('error', sass.logError))    
    .pipe(sass({outputStyle:"compact"}))
    .pipe(autoprefix('>1%'))
    .pipe(gulp.dest('app/css'))
    .pipe(base64(config.options))
    .pipe(gulp.dest('app/css'))
    /*.pipe(browserSync.reload({
      stream: true
    }))*/
})

/*gulp.task('browserSync', function(){
  browserSync({
    server: {
      baseDir: ''
    }
  })
})*/

gulp.task('webserver', function() {
    gulp.src('./') // 服务器目录（./代表根目录）
    .pipe(webserver({ // 运行gulp-webserver
        port: 3001, //端口，默认3001
        livereload: true, // 启用LiveReload
        open: true, // 服务器启动时自动打开网页
        directoryListing: {
            enable: true,  
            path: './'
        },
        middleware: function(req, res, next) {
            //mock local data
            var urlObj = url.parse(req.url, true),
                method = req.method;


            if (!urlObj.pathname.match(/^\/api/)) { //不是api开头的数据，直接next
                next();
                return;
            }
            var mockDataFile = path.join(__dirname, urlObj.pathname) + ".json"; //可修改文件类型，如js
            //file exist or not
            fs.access(mockDataFile, fs.F_OK, function(err) {
                if (err) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        "status": "没有找到此文件",
                        "notFound": mockDataFile
                    }));
                    return;
                }
                var data = fs.readFileSync(mockDataFile, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
            });
            next();
        },
        proxies: []
    }));
});


gulp.task("tpl", function(){
  return gulp.src(['./hello.html'])
    .pipe(includeTpl({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest("./dist"));
});

gulp.task('watch', ['webserver'], function(){
  gulp.watch('app/scss/**/*.scss', ['css']);
  gulp.watch(['*.html','**/*.html','app/js/**/*.js']);
});

gulp.task('default',function() {  
  gulp.start( 'watch');
});