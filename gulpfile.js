
'use strict';

var gulp                       = require('gulp'),
	runSequence                = require('run-sequence'),
	conventionalChangelog      = require('conventional-changelog'),
	conventionalGithubReleaser = require('conventional-github-releaser'),
	bump                       = require('gulp-bump'),
	gutil                      = require('gulp-util'),
	git                        = require('gulp-git'),
	fs                         = require('fs');


gulp.task('changelog', function () {
	return gulp.src('CHANGELOG.md', {
				buffer: false
			})
			.pipe(conventionalChangelog({
				preset: 'angular' // Or to any other commit message convention you use.
			}))
			.pipe(gulp.dest('./'));
});

gulp.task('github-release', function(done) {
	conventionalGithubReleaser({
		type: "oauth",
		token: '46e1c77d2e11dd7402f0346923fa53731a1f88a4' // change this to your own GitHub token or use an environment variable
	}, {
		preset: 'angular' // Or to any other commit message convention you use.
	}, done);
});

gulp.task('bump-version', function () {
	// We hardcode the version change type to 'patch' but it may be a good idea to
	// use minimist (https://www.npmjs.com/package/minimist) to determine with a
	// command argument whether you are doing a 'major', 'minor' or a 'patch' change.
	return gulp.src(['./bower.json', './package.json'])
				.pipe(bump({type: "patch"}).on('error', gutil.log))
				.pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {
	return gulp.src('.')
				.pipe(git.add())
				.pipe(git.commit('[Prerelease] Bumped version number'));
});

gulp.task('push-changes', function (cb) {
	git.push('origin', 'master', cb);
});

gulp.task('create-new-tag', function (cb) {
	var version = getPackageJsonVersion();
	git.tag(version, 'Created Tag for version: '+ version, function (error) {
		if (error) {
			return cb(error);
		}
		git.push('origin', 'master', {args: '--tags'}, cb);
	});

	function getPackageJsonVersion () {
		// We parse the json file instead of using require because require caches
		// multiple calls so the version number won't be updated
		return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
	};
});

gulp.task('release', function (callback) {
	runSequence(
		'bump-version',
		'changelog',
		'commit-changes',
		'push-changes',
		'create-new-tag',
		'github-release',
		function (error) {
			if (error) {
				console.log(error.message);
			} else {
				console.log('RELEASE FINISHED SUCCESSFULLY');
			}
			callback(error);
		});
});
