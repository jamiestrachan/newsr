module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
        default: [ 'newsr' ]
    },    

    connect: {
        server: {
            options: {
                port: grunt.option('port')? grunt.option('port'): 9000,
                hostname: '*',
                base: 'newsr',
                middleware: function (connect, options) {
                    var middlewares = [];
                    var modRewrite = require('connect-modrewrite');

                    middlewares.push(modRewrite([
                        '^/newsr/read/ /newsr/read.html [L]',
                        '^/newsr/scan/ /newsr/scan.html [L]',
                    ]));

                    middlewares.push(connect.static(options.base[0]));
                    middlewares.push(connect.directory(options.base[0]));
                    
                    return middlewares;
                }
            }
        }
    },

    open: {
        local: {
            path: 'http://localhost:' + (grunt.option('port')? grunt.option('port'): 9000) + '/newsr/'
        }
    },

    watch: {
        files: [  ],
        tasks: [  ]
    }
  });

  grunt.loadNpmTasks( 'grunt-contrib-clean' );
  grunt.loadNpmTasks( 'grunt-contrib-connect' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-open' );

  // Default task(s).
  //grunt.registerTask('default', []);

  grunt.registerTask('develop', [
    'connect:server',
    'open:local',
    'watch'
  ]);

};