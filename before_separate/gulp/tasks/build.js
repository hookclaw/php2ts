"use strict";

var gulp = require("gulp");
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var fs = require('fs');
var through = require('through2');

var child_process = require('child_process');


function tsc(tsconfig) {
	return function() {
			return gulp.src(tsconfig)
				.pipe(tsc_task());
		};
}

function tsc_task() {
	return through.obj(
		function (file,encoder,cb) {
			var cmd = 'tsc -p ' + file.path;
			//console.log(cmd);
			var stdout = "";
			try {
				stdout = child_process.execSync(cmd);
			} catch(e) {
				console.log(e.message);
				console.log(e.stdout.toString());
				gulp.stop();
				return;
			}
			if(typeof stdout != "string"){
				stdout = stdout.toString();
			}
			stdout = stdout.trim();
			if( stdout != "" ) {
				console.log(stdout);
				gulp.stop();
				return;
			}
			this.push(file);
			cb();
		}
	);
}

gulp.task('tscServer', tsc('TS/tsconfig.json'));
gulp.task('tscClient', tsc('TS/share/tsconfig.json'));

gulp.task('build', ['tscClient','tscServer']);
