//require("harmonize")();
var gulp = require("gulp");
var babel = require("gulp-babel");
var minify = require('gulp-minify');

gulp.task('default', ['json', 'js']);

gulp.task("js", function () {
    return gulp.src(["src/**/*.js"])
        .pipe(babel({
            blacklist: ['bluebirdCoroutines', 'regenerator']
        }))
        .pipe(gulp.dest("build"));
});

gulp.task("json", function () {
    return gulp.src(["src/**/*.json"])
        .pipe(gulp.dest("build"));
});

gulp.task("ex", function () {
    return gulp.src(["src/**/*.js"])
        .pipe(babel({
            blacklist: ['bluebirdCoroutines', 'regenerator']
        }))
        .pipe(gulp.dest("build"))
        .on('end', function () {
            require("./build/app");
        });
});


gulp.task('compress', function () {
    gulp.src('dev-util/utils/jsonld.js')
        .pipe(minify({}))
        .pipe(gulp.dest('build/compressed'))
});