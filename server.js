/* 
Imports
*/
    // NPM modules
    require('dotenv').config(); //=> https://www.npmjs.com/package/dotenv
    const express = require('express'); //=> https://www.npmjs.com/package/express
    const path = require('path'); //=> https://www.npmjs.com/package/path
    const ejs = require('ejs'); //=> https://www.npmjs.com/package/ejs
    const webpush = require('web-push'); //=> https://www.npmjs.com/package/web-push
    const fetch = require('node-fetch'); //=> https://www.npmjs.com/package/node-fetch

    const { initWebPush, defineService, sendPushNotification, autoPush } = require('./services/webpush.service');
//

/* 
Server class
*/
class ServerClass{
    constructor(){
        this.app = express();
        this.server = require('http').Server(this.app);
        this.io = require('socket.io')(this.server)
        this.port = process.env.PORT;
    }

    init(){
        //=> Set body request with ExpressJS (http://expressjs.com/fr/api.html#express.json)
        this.app.use(express.json({limit: `20mb`}));
        this.app.use(express.urlencoded({ extended: true }))

        //=> Start server setup
        this.setup();
    }

    setup(){
        // Set CORS
        this.app.use( (req, res, next) => {
            // Setup CORS
            res.setHeader(`Access-Control-Allow-Origin`, `*`)
            res.header(`Access-Control-Allow-Credentials`, true);
            res.header(`Access-Control-Allow-Methods`, [`GET`, `PUT`, `POST`, `DELETE`, `POST`]);
            res.header(`Access-Control-Allow-Headers`, `Origin, X-Requested-With, Content-Type, Accept`);

            // Use next() function to continue routing
            next();
        });

        
        //=> View engine configuration
        this.app.engine( `html`, ejs.renderFile );
        this.app.set(`view engine`, `html`);
        
        //=> Static path configuration: define `www` folder for backoffice static files
        this.app.set( `views`, __dirname + `/www` );
        this.app.use( express.static(path.join(__dirname, `www`)) );

        //=> Set body request with ExpressJS: BodyParser not needed (http://expressjs.com/fr/api.html#express.json)
        this.app.use(express.json({limit: `20mb`}));
        this.app.use(express.urlencoded({ extended: true }))

        // Init WebPush
        initWebPush();

        // Set Scket.io
        this.io.on('connection', (socket) => {
            console.log('a user connected', socket.id);
            socket.on('disconnect', () => { console.log('user disconnected', socket.id) })
        });

        //=> Bind HTTP client request
        this.bindHttpRequest();
    }

    bindHttpRequest(){
        // Route to get subscriber list
        this.app.get(`/push/subscribers`, async (req, res) => {
            const subscribers = await fetch(`${process.env.JSON_SERVER_URL}/subscribers`).then( data => data.json() );

            // Send success request
            return res.status(200).json({
                endpoint: req.originalUrl,
                method: req.method,
                message: `Request succeed`,
                err: null,
                data: subscribers,
                status: 200
            });
        })

        // Route to get notification public key
        this.app.get(`/push/key`, (req, res) => {
            // Send success request
            return res.status(200).json({
                endpoint: req.originalUrl,
                method: req.method,
                message: `Request succeed`,
                err: null,
                data: process.env.PUBLIC_KEY,
                status: 200
            });
        })

        this.app.post(`/push/notification`, async (req, res) => {
            // Get subscriber
            const subscriber = await fetch(`${process.env.JSON_SERVER_URL}/subscribers/${req.body.subscriber}`).then( data => data.json() );

            // Send push notification
            await sendPushNotification(`DWSapp new notification`, `Message send by the API`, subscriber, this.io);

            // Send success request
            return res.status(200).json({
                endpoint: req.originalUrl,
                method: req.method,
                message: `Notification send to ${subscriber.id}`,
                err: null,
                data: subscriber,
                status: 200
            });
        })

        // Route to subscribe new user
        this.app.post(`/push/subscribe`, async (req, res) => {
            // Check subscriber
            const subscriber = await fetch(`${process.env.JSON_SERVER_URL}/subscribers?endpoint=${req.body.endpoint}`).then( data => data.json() );
                
            // Check if subscriber is already registered
            if(subscriber.length === 0){
                // Set subscriber options
                const options = {
                    method: `POST`,
                    headers: { 'Content-Type': 'application/json'  },
                    body: JSON.stringify(req.body)
                }
                
                // Register new subscriber
                const newSubscriber = await fetch(`${process.env.JSON_SERVER_URL}/subscribers`, options).then( data => data.json() );

                // Define navigator service
                let navigatoreName = defineService(newSubscriber);

                // Send push notification
                await sendPushNotification(`DWSapp subscription active`, `Subscribed ${navigatoreName} ${newSubscriber.id}`, newSubscriber, this.io);

                // Emit socket
                this.io.emit('new-subsciption', JSON.stringify({ id: newSubscriber.id, navigator: navigatoreName }));

                // Debug
                console.log(`Subscribed ${navigatoreName} ${newSubscriber.id}`);

                // Fetch all subscribers
                const subscribers = await fetch(`${process.env.JSON_SERVER_URL}/subscribers`).then( data => data.json() );

                // Loop on subscribers
                for( let item of subscribers ){
                    // Check item id
                    if(item.id !== newSubscriber.id){
                        // Define navigator service
                        let navigatoreName = defineService(item);

                        // Send push notification
                        await sendPushNotification(`DWSapp new subscription`, `Subscribed ${navigatoreName} ${item.id}`, item, this.io);
                    }
                }

                // Send success request
                return res.status(200).json({
                    endpoint: req.originalUrl,
                    method: req.method,
                    message: `Subscribed ${navigatoreName} ${newSubscriber.id}`,
                    err: null,
                    data: newSubscriber,
                    status: 200
                });
            }
            else{
                // Define navigator service
                let navigatoreName = defineService(newSubscriber);

                // Send push notification
                await sendPushNotification(`DWSapp Push Notification`, `Already subscribed ${newSubscriber.id} with ${navigatoreName}`, this.io, newSubscriber);

                // Send success request
                return res.status(200).json({
                    endpoint: req.originalUrl,
                    method: req.method,
                    message: `Already subscribed ${newSubscriber.id} with ${navigatoreName}`,
                    err: null,
                    data: subscriber[0],
                    status: 200
                });
            }
        })

        //=> Launch server
        this.launch();
    }

    launch(){
        // Start server
        this.server.listen(this.port, () => {
            // Debug
            console.log({
                node: `http://localhost:${this.port}`,
            });
        });

        // Auto push notification
        //autoPush(5000, this.io);
    }
}
//

/* 
Start server
*/
    const notificationApi = new ServerClass();
    notificationApi.init();
//