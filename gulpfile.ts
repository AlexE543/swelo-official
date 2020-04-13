import * as gulp from "gulp";
import * as del from "del";
import * as ts from 'gulp-typescript';
import * as size from 'gulp-size';


const GULP_CONFIGURATION = {
    "BUILD_OUTPUT_ROOT":"./",
    "BUILD_OUTPUT_DIRECTORY": "build",
    "SOURCE_ROOT": "./",
    "SOURCE_DIRECTORY": "src"
};

const buildDir: string = GULP_CONFIGURATION.BUILD_OUTPUT_ROOT + GULP_CONFIGURATION.BUILD_OUTPUT_DIRECTORY;
const sourceDir: string = GULP_CONFIGURATION.SOURCE_ROOT + GULP_CONFIGURATION.SOURCE_DIRECTORY;

gulp.task("build", function(){
    let tsProject = ts.createProject('tsconfig.json');//use our settings in the tsconfig.json to transpile our project
    return gulp.src([sourceDir + "/**/**.ts"])
    .pipe(tsProject())//transpile stream
    .pipe(size())
    .pipe(gulp.dest(buildDir));
});


gulp.task('clean', function(done){
    del.sync(buildDir);
    done();
});

gulp.task("default", gulp.series("clean", "build"));