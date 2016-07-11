//require("harmonize")();
var gulp = require("gulp");
var babel = require("gulp-babel");
var minify = require('gulp-minify');

gulp.task("es6-js", function () {
	return gulp.src(["src/**/*.js", "tests/**/*.js"])
		.pipe(babel())
		.pipe(gulp.dest("build"))
		.on('end', function () {
			console.log('end build');
		});
});

gulp.task("json", function () {
	return gulp.src(["src/**/*.json", "tests/**/*.json"])
		.pipe(gulp.dest("build"));
});

gulp.task('es6', ['es6-js', 'json']);

gulp.task('upd', ['es6'], function () {
	return gulp.src(["build/**/*.js"])
		.pipe(gulp.dest("../iris-v2/node_modules/cbird-rdf/build"));
});

gulp.task('upd-cb', function () {
	return gulp.src(["../Couchbird/**/*.js"])
		.pipe(gulp.dest("../iris-v2/node_modules/Couchbird"));
});

gulp.task('test-upd', function () {
	gulp.watch(["src/**/*.js", "../Couchbird/src/**/*.js", "tests/**/*.js"], ['upd', 'upd-cb']);
});

gulp.task("dev", ['es6'],
	function () {
		return gulp.src(["dev-util/**/*.js"])
			.pipe(babel())
			.pipe(gulp.dest("build/dev-util"))
			.on('end', function () {
				require("./build/dev-util/app");
			});
	});


gulp.task('compress', function () {
	gulp.src('dev-util/utils/jsonld.js')
		.pipe(minify({}))
		.pipe(gulp.dest('build/compressed'))
});