var gulp = require('gulp');
var browserSync = require('browser-sync').create();

var DIR = {
  DIST: 'dist'
}

// WebServerを起動する
gulp.task('server', function(){
  browserSync.init({
    server: DIR.DIST,
    watch: true,
    host: process.env.DEV_HOST || 'localhost',
    port: process.env.DEV_PORT || 3000,
    ui: false,
    open: false
  });
});