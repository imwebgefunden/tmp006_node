module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        "jsbeautifier": {
            files: ["*.js", "examples/**/*js", "test/**/*js"],
            options: {}
        },
        jshint: {
            all: ['*.js', 'examples/**/*.js', 'test/**/*.js']
        },
        nodeunit: {
            all: ['test/nu_tests/*.js']
        },
        todo: {
            options: {},
            src: ["*.js", "examples/**/*js", "test/**/*js"],
        },
    });
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-todo');
    // Default task(s).
    grunt.registerTask('default', ['jsbeautifier', 'todo', 'jshint', 'nodeunit']);
    //grunt.registerTask('default', ['jsbeautifier', 'nodeunit']);

};
