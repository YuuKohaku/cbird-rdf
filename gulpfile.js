var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var watch = require('gulp-watch');
var server = require('gulp-develop-server');
var livereload = require('gulp-livereload');
var changed = require('gulp-changed');

require('harmonize')();

var options = {
    path: './build/index.js',
    execArgv: ['--harmony']
};

gulp.task("default", function () {
    return gulp.src(["src/**/*.js", "examples/**/*.js"])
        .pipe(babel({
            blacklist: ['bluebirdCoroutines', 'regenerator']
        }))
        .pipe(gulp.dest("build"))
//        .on('end', function () {
//            setTimeout(function () {
//                console.log('timeout');
//                process.exit()
//            }, 30000);
//        });
});