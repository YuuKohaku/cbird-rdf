//require("harmonize")();
var gulp = require("gulp");
var babel = require("gulp-babel");
var minify = require('gulp-minify');

gulp.task("es6-js", function() {
	return gulp.src(["src/**/*.js", "tests/**/*.js"])
		.pipe(babel())
		.pipe(gulp.dest("build"))
		.on('end', function() {
			console.log('end build');
		});
});

gulp.task("json", function() {
	return gulp.src(["src/**/*.json", "tests/**/*.json"])
		.pipe(gulp.dest("build"));
});

gulp.task('es6', ['es6-js', 'json']);

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