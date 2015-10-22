//require("harmonize")();
var gulp = require("gulp");
var babel = require("gulp-babel");

gulp.task("default", function () {
    return gulp.src(["src/**/*.js", "examples/**/*.js"])
        .pipe(babel({
            blacklist: ['bluebirdCoroutines', 'regenerator']
        }))
        .pipe(gulp.dest("build"));
});

gulp.task("ex", function () {
    return gulp.src(["src/**/*.js", "examples/**/*.js"])
        .pipe(babel({
            blacklist: ['bluebirdCoroutines', 'regenerator']
        }))
        .pipe(gulp.dest("build"))
        .on('end', function () {
            require("./build/app");
        });
});