//require("harmonize")();
var gulp = require("gulp");
var babel = require("gulp-babel");
var minify = require('gulp-minify');

gulp.task('default', ['json', 'js']);

gulp.task("js", function() {
	return gulp.src(["src/**/*.js"])
		.pipe(babel())
		.pipe(gulp.dest("build"));
});

gulp.task("json", function() {
	return gulp.src(["src/**/*.json"])
		.pipe(gulp.dest("build"));
});

gulp.task("dev", ['default'],
	function() {
		return gulp.src(["dev-util/**/*.js"])
			.pipe(babel())
			.pipe(gulp.dest("build/dev-util"))
			.on('end', function() {
				require("./build/dev-util/app");
			});
	});


gulp.task('compress', function() {
	gulp.src('dev-util/utils/jsonld.js')
		.pipe(minify({}))
		.pipe(gulp.dest('build/compressed'))
});