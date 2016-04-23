module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            options: {
                banner: "/*! <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */\n"
            },
            build: {
                src: "src/<%= pkg.name %>.js",
                dest: "build/<%= pkg.name %>.min.js"
            }
        },
        codacy: {
            options: {
                // Task-specific options go here. 
            },
            basic_test: {
                src: "coverage/lcov.info"
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: "spec",
//                  captureFile: "results.txt", // Optionally capture the reporter output to a file
                    quiet: false, // Optionally suppress output to standard out (defaults to false) 
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false) 
                },
                src: ["test/**/*.js"]
            }
        },
        mocha_istanbul: {
            target: {
                src: "test/**/*.js",
                options: {
                    coverageFolder: "coverage",
                    coverage: true,
                    noColors: true,
                    dryRun: false,
                    //root: "./test",
                    //root: "./tasks",
                    print: "detail",
                    check: {
                        lines: 1
                    },
                    excludes: ["test/excluded*.js"],
                    mochaOptions: ["--bail", "--debug-brk"],
                    istanbulOptions: ["--default-excludes"],
                    reporter: "spec",
                    reportFormats: ["lcovonly"]
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-codacy");
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks("grunt-mocha-istanbul");
    grunt.loadNpmTasks("grunt-mocha-test");

    // Default task(s).
    grunt.registerTask("default", ["mochaTest"]);
};