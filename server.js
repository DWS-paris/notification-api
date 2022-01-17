/* 
Imports
*/
    // NPM modules
    require('dotenv').config(); //=> https://www.npmjs.com/package/dotenv
    const express = require('express'); //=> https://www.npmjs.com/package/express
    const path = require('path'); //=> https://www.npmjs.com/package/path
    const ejs = require('ejs'); //=> https://www.npmjs.com/package/ejs
//

/* 
Server class
*/
class ServerClass{
    constructor(){
        this.server = express();
        this.port = process.env.PORT;
    }

    init(){
        //=> Set body request with ExpressJS (http://expressjs.com/fr/api.html#express.json)
        this.server.use(express.json({limit: '20mb'}));
        this.server.use(express.urlencoded({ extended: true }))

        //=> Start server setup
        this.setup();
    }

    setup(){
        //=> View engine configuration
        this.server.engine( 'html', ejs.renderFile );
        this.server.set('view engine', 'html');
        
        //=> Static path configuration: define 'www' folder for backoffice static files
        this.server.set( 'views', __dirname + '/www' );
        this.server.use( express.static(path.join(__dirname, 'www')) );



        //=> Launch server
        this.launch();
    }

    launch(){
        // Start server
        this.server.listen(this.port, () => {
            console.log({
                node: `http://localhost:${this.port}`,
            });
        });
    }
}
//

/* 
Start server
*/
    const apIRestfull = new ServerClass();
    apIRestfull.init();
//