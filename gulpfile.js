var app,
    changed     = require('gulp-changed'),
    database    = require('./src/db/database.json'),
    embedlr     = require('gulp-embedlr'),
    ecsport     = 8888,
    ecstatic    = require('ecstatic')({root: './dist', cache: 'no-cache', showDir: true}), port = ecsport,
    gulp        = require('gulp'),
    gulpif      = require('gulp-if'),
    gulputil    = require('gulp-util'),
    http        = require('http'),
    ignore      = require('gulp-ignore'),
    jade        = require('gulp-jade'),
    live        = false,
    livereload  = require('gulp-livereload'),
    path        = require('path'),
    purge       = false,
    sass        = require('gulp-sass'),
    uglify      = require('gulp-uglify'),
    url         = require('url'),
    del         = require('del'),
    vinylPaths  = require('vinyl-paths'),
    sixToFive   = require('gulp-6to5');



// check to see if --live was set
process.argv.forEach(function (val) {
    if (val === '--live') {
        live = true;
    }
    if (val === '--purge') {
        purge = true;
    }
});

// clear dist
gulp.task('clean', function () {
    return gulp.src('./dist/*.*', { read: false })
        .pipe(vinylPaths(del));
});

//convert ES6 to ES5
gulp.task('6to5', function () {
    return gulp.src('./src/es6/*.js')
        .pipe(sixToFive())
        .pipe(gulp.dest('./src/js'));
});

// compile scss as compressed css
gulp.task('sass', function () {
    return gulp.src('./src/scss/*.scss')
        .pipe(changed('./dist/css'))
        .pipe(sass({'outputStyle': 'compressed'}))
        .pipe(gulp.dest('./dist/css'));
});

// jade to html
gulp.task('jade', function () {
    return gulp.src('./src/jade/*.jade')
        .pipe(jade({
            'pretty': true,
            'locals': database
        }))
        .pipe(gulpif(!live, embedlr()))
        .pipe(gulp.dest('./dist'));
});

// move static assets
gulp.task('assets', function () {
    gulp.src('./src/bower_components/**')
        .pipe(gulp.dest('./dist/bower_components'));
    gulp.src('./src/img/**')
        .pipe(gulp.dest('./dist/img'));
});

// compress javascript
gulp.task('uglify', function () {
    return gulp.src('./src/js/*.js')
        .pipe(changed('./dist/js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js'));

});



// all build tasks
gulp.task('build', ['clean', '6to5', 'sass', 'jade', 'assets', 'uglify']);



// start static server listening on port 'ecsport'
gulp.task('static', ['build'], function (next) {
    http.createServer()
        .on('request', function (req, res) {
            ecstatic(req, res);
        })
        .listen(port, function () {
            gulputil.log('Static server is listening at ' + gulputil.colors.cyan('http://localhost:' + ecsport + '/') + ' Excelsior! :)');
            next();
        });
});



// start livereload server, listening on port 'lrport'
gulp.task('watch', ['static'], function () {
    gulp.watch('./src/es6/*.js', ['6to5']);
    gulp.watch('./src/scss/*.scss', ['sass']);
    gulp.watch('./src/jade/**/*.jade', ['jade']);
    gulp.watch('./src/js/*.js', ['uglify']);
    gulp.watch('./src/db/database.json', ['clean', 'build']);

    gulp.watch(['./dist/**'], function (file) {
        livereload.changed(file.path);
    })
});



// run the default task on first run
gulp.task('default', function () {
    if (purge === true) {
        gulp.start('purge');
    }
    if (purge === false) {
        gulp.start(['clean', 'watch']);
    }
});
