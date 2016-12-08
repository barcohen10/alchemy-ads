const gulp = require('gulp');
const sass = require('gulp-sass');
const nodemon = require('gulp-nodemon');

const SCRIPTS = {
	SASS: [
		'public/sass/*.scss'
	]
}

gulp.task('default', ['sass', 'watch', 'start']);

gulp.task('start', () => nodemon({script: 'app.js', ext: 'js html'}))

gulp.task('sass', () => {
	return gulp.src(SCRIPTS.SASS)
			.pipe(sass().on('error', sass.logError))
			.pipe(gulp.dest('public/css'));
});

gulp.task('watch', () => {
	gulp.watch(SCRIPTS.SASS, ['sass']);
})