/**
 * Created by patrickliu on 15/5/26.
 */

var includeTemplate = require('./index'),
    path = require('path'),
    gulp = require('gulp'),
    mocha = require('gulp-mocha');


includeTemplate.config('base', path.dirname(__filename) + '/test');

gulp.task('gen1', function() {
    return gulp.src('test/onlyInclude.html')
        .pipe(includeTemplate())
        .pipe(gulp.dest('test/compiled'));
});

gulp.task('gen2', function() {
    return gulp.src('test/onlyIncludeNative.html')
        .pipe(includeTemplate())
        .pipe(gulp.dest('test/compiled'));
});

gulp.task('gen3', function() {
    return gulp.src('test/includeAndIncludeNative.html')
        .pipe(includeTemplate())
        .pipe(gulp.dest('test/compiled'));
});

gulp.task('gen4', function() {
    return gulp.src('test/mixed.html')
        .pipe(includeTemplate())
        .pipe(gulp.dest('test/compiled'));
});

gulp.task('mocha', ['gen1', 'gen2', 'gen3', 'gen4'], function() {
    return gulp.src('test/main.js')
               .pipe(mocha());
});

gulp.task('default', ['mocha']);
