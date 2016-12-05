/*------------------------------------*\
    MODULES
\*------------------------------------*/

var gulp = require('gulp'),
	wrap = require('gulp-wrap'),
	watch = require('gulp-watch'),
	svgmin = require('gulp-svgmin'),
	svgSymbols = require('gulp-svg-symbols'),
	nunjucksRender = require('gulp-nunjucks-render'),
	del = require('del'),
	sass = require('gulp-sass'),
	connect = require('gulp-connect'),
	plumber = require('gulp-plumber'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	sourcemaps = require('gulp-sourcemaps'),
	cleanCSS = require('gulp-clean-css'),
	autoprefixer = require('gulp-autoprefixer'),
	data = require('gulp-data'),
	fs = require('fs'),
	merge = require('merge-stream'),
	runSequence = require('run-sequence').use(gulp),
	prettify = require('gulp-prettify');


/*------------------------------------*\
    GLOBAL VARS
\*------------------------------------*/

var SVG_PATH = 'svg',
	TEMPLATE_PATH = 'templates',
	SCRIPT_PATH = 'scripts',
	SCSS_ROOT_PATH = 'scss',
	SCSS_PATH = SCSS_ROOT_PATH + '/project',
	IMAGE_PATH = 'images',
	SVG_SYMBOL_PATH = IMAGE_PATH + '/icons',
	FONT_PATH = 'fonts',
	WEB_PATH = 'assets/.tmp',
	WEB_CSS_PATH = WEB_PATH + '/css',
	WEB_SCRIPT_PATH = WEB_PATH + '/scripts',
	WEB_IMAGE_PATH = WEB_PATH + '/images',
	WEB_FONT_PATH = WEB_PATH + '/fonts',
	WEBSITE_PATH = '../../website',
	WEBSITE_CSS_PATH = WEBSITE_PATH + '/css',
	WEBSITE_SCRIPT_PATH = WEBSITE_PATH + '/scripts',
	WEBSITE_IMAGE_PATH = WEBSITE_PATH + '/images',
	WEBSITE_FONT_PATH = WEBSITE_PATH + '/fonts',
	COMPONENT_LIB_PATH = 'assets',
	COMPONENT_LIB_CSS_PATH = COMPONENT_LIB_PATH + '/css',
	COMPONENT_LIB_SCRIPT_PATH = COMPONENT_LIB_PATH + '/scripts',
	COMPONENT_LIB_IMAGE_PATH = COMPONENT_LIB_PATH + '/images',
	COMPONENT_LIB_FONT_PATH = COMPONENT_LIB_PATH + '/fonts',
	DATA_FILE = 'data.json';


/*------------------------------------*\
    TASKS
\*------------------------------------*/

// Clean the web path out
gulp.task('clean-web', function(cb) {
	del([WEB_PATH], {force: true}, function() {
		cb();
	});
});

// Find all SVG and smash into a symbols file
gulp.task('process-svg', function() {

	return gulp.src(SVG_PATH + '/*.svg')
				.pipe(svgmin())
			    .pipe(svgSymbols())
			    .pipe(gulp.dest(SVG_SYMBOL_PATH));
});

// Clean up unese
gulp.task('clean-svg-output-mess', function() {

	del([SVG_SYMBOL_PATH + '/*.css'], {force: true}, function() {});
});

// Process all the nunjucks templates
gulp.task('process-templates', function() {

	var contents = fs.readFileSync(DATA_FILE);

	nunjucksRender.nunjucks.configure([TEMPLATE_PATH + '/']);

	return gulp.src(TEMPLATE_PATH + '/*.html')
				.pipe(data(function(file) {
					return JSON.parse(contents);
				}))
				.pipe(nunjucksRender())
				.pipe(prettify({indent_size: 4}))
				.pipe(gulp.dest(WEB_PATH));
});

// Process sass
gulp.task('process-sass', function () {

	return gulp.src(SCSS_PATH + '/**/*.scss')
				.pipe(plumber())
				.pipe(sourcemaps.init())
				.pipe(sass().on('error', sass.logError))
				.pipe(autoprefixer({
					browsers: ['last 2 versions'],
					cascade: false
				}))
				.pipe(cleanCSS())
				.pipe(sourcemaps.write('.'))
				.pipe(gulp.dest(WEB_PATH + '/css'));
});

// Process JavaScript libs
gulp.task('process-script-libs', function() {

	var sources = [
		SCRIPT_PATH + '/lib/*.js'
	];

	return gulp.src(sources)
				.pipe(plumber())
				.pipe(concat('lib.js'))
				.pipe(uglify())
				.pipe(gulp.dest(WEB_PATH + '/scripts'));
});

// Process JavaScript
gulp.task('process-scripts', function() {

	var sources = [
		SCRIPT_PATH + '/_helpers.js',
		SCRIPT_PATH + '/modules/*.js',
		SCRIPT_PATH + '/app.js'
	];

	// Process libs first
	gulp.start('process-script-libs');

	return gulp.src(sources)
				.pipe(plumber())
				.pipe(sourcemaps.init())
				.pipe(concat('app.js'))
				.pipe(uglify())
				.pipe(sourcemaps.write('.'))
				.pipe(gulp.dest(WEB_PATH + '/scripts'));
});

// Process images
gulp.task('process-images', function() {

	return gulp.src([IMAGE_PATH + '/**/*'])
				.pipe(gulp.dest(WEB_PATH + '/images'));
});

// Process fonts
gulp.task('process-fonts', function() {

	return gulp.src([FONT_PATH + '/**/*'])
				.pipe(gulp.dest(WEB_PATH + '/fonts'));
});

// Webserver
gulp.task('webserver', function() {

	connect.server({
	    root: WEB_PATH,
	    port: 8003,
	    livereload: true
	});

});

// Live reload
gulp.task('livereload', function () {

	return gulp.src( WEB_PATH + '/**/*' )
		.pipe(connect.reload());
});

// Copy assets from the WEB_PATH to the set website asset paths
gulp.task('website-assets', function() {

	// Image files
	var websiteImages = gulp.src([IMAGE_PATH + '/**/*'])
							.pipe(gulp.dest(WEBSITE_IMAGE_PATH));

	// CSS files
	var websiteCSS = gulp.src([WEB_PATH + '/css/**/*'])
							.pipe(gulp.dest(WEBSITE_CSS_PATH));

	// Script files
	var websiteScripts = gulp.src([WEB_PATH + '/scripts/**/*'])
							.pipe(gulp.dest(WEBSITE_SCRIPT_PATH));

	// Font files
	var websiteFonts = gulp.src([WEB_PATH + '/fonts/**/*'])
							.pipe(gulp.dest(WEBSITE_FONT_PATH));

	// Merge the mini tasks
	return merge(websiteImages, websiteCSS, websiteScripts, websiteFonts);

});

// Copy assets from the WEB_PATH to the set website asset paths
gulp.task('component-assets', function() {

	// Image files
	var componentImages = gulp.src([IMAGE_PATH + '/**/*'])
							.pipe(gulp.dest(COMPONENT_LIB_IMAGE_PATH));

	// CSS files
	var componentCSS = gulp.src([WEB_PATH + '/css/**/*'])
							.pipe(gulp.dest(COMPONENT_LIB_CSS_PATH));

	// Script files
	var componentScripts = gulp.src([WEB_PATH + '/scripts/**/*'])
							.pipe(gulp.dest(COMPONENT_LIB_SCRIPT_PATH));

	// Font files
	var componentFonts = gulp.src([WEB_PATH + '/fonts/**/*'])
							.pipe(gulp.dest(COMPONENT_LIB_FONT_PATH));

	// Merge the mini tasks
	return merge(componentImages, componentCSS, componentScripts, componentFonts);

});

// Process and watch all assets for the component library
gulp.task('components', function() {

	// Run build then set watch targets in the callback
	runSequence('clean-web', 'process-svg', 'clean-svg-output-mess', 'process-templates', 'process-sass', 'process-scripts', 'process-images', 'process-fonts', 'component-assets', function() {

		// Watch for changes with SVG
		watch([SVG_PATH + '/*.svg'], function() { runSequence('process-svg', 'clean-svg-output-mess', function() { gulp.start('component-assets'); }); });

		// Watch for changes with sass
		watch([SCSS_ROOT_PATH + '/**/*.scss'], function() { runSequence('process-sass', function() { gulp.start('component-assets'); }); });

		// Watch for changes with images
		watch([IMAGE_PATH + '/**/*'], function() { runSequence('process-images', function() { gulp.start('component-assets'); }); });

		// Watch for changes with fonts
		watch([FONT_PATH + '/**/*'], function() { runSequence('process-fonts', function() { gulp.start('component-assets'); }); });

		// Watch for changes with scripts
		watch([SCRIPT_PATH + '/**/*.js'], function() { runSequence('process-scripts', function() { gulp.start('component-assets'); }); });

	});

});

// Process and watch all assets for the actual website project
gulp.task('watch', function() {

	// Run build then set watch targets in the callback
	runSequence('clean-web', 'process-svg', 'clean-svg-output-mess', 'process-templates', 'process-sass', 'process-scripts', 'process-images', 'process-fonts', 'website-assets', function() {

		// Watch for changes with SVG
		watch([SVG_PATH + '/*.svg'], function() { runSequence('process-svg', 'clean-svg-output-mess', function() { gulp.start('website-assets'); }); });

		// Watch for changes with sass
		watch([SCSS_ROOT_PATH + '/**/*.scss'], function() { runSequence('process-sass', function() { gulp.start('website-assets'); }); });

		// Watch for changes with images
		watch([IMAGE_PATH + '/**/*'], function() { runSequence('process-images', function() { gulp.start('website-assets'); }); });

		// Watch for changes with fonts
		watch([FONT_PATH + '/**/*'], function() { runSequence('process-fonts', function() { gulp.start('website-assets'); }); });

		// Watch for changes with scripts
		watch([SCRIPT_PATH + '/**/*.js'], function() { runSequence('process-scripts', function() { gulp.start('website-assets'); }); });

	});

});

gulp.task('default', function() {
	gulp.start('components');
});
