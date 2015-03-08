module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      default: [ 'newsr' ]
    },

    copy: {
      default: {
        files: [
          { expand: true, cwd: 'src', src: ['*.html'], dest: 'newsr/'}
        ]
      }
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
                    var contentHost = "http://www.cbc.ca";

                    if (grunt.option('content') === 'qa') {
                        contentHost = "http://www.qa.nm.cbc.ca";
                    }

                    middlewares.push(modRewrite([
                      '^/json/(.*)$ ' + contentHost + '/json/$1 [P]',
                      '^/scan/.*$ /index.html [L]',
                      '^/read/.+$ /index.html [L]'
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
            path: 'http://localhost:' + (grunt.option('port')? grunt.option('port'): 9000)
        }
    },

    watch: {
        files: [ 'src/**/*' ],
        tasks: [ 'default' ]
    }
  });

  grunt.loadNpmTasks( 'grunt-contrib-clean' );
  grunt.loadNpmTasks( 'grunt-contrib-copy' );
  grunt.loadNpmTasks( 'grunt-contrib-connect' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-open' );

  // Default task(s).
  grunt.registerTask('default', [ 'clean', 'copy' ]);

  grunt.registerTask('develop', [
    'default',
    'connect:server',
    'open:local',
    'watch'
  ]);

};