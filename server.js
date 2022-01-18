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
        this.server.use(express.json({limit: `20mb`}));
        this.server.use(express.urlencoded({ extended: true }))

        //=> Start server setup
        this.setup();
    }

    setup(){
        // Set CORS
        this.server.use( (req, res, next) => {
            // Setup CORS
            res.setHeader(`Access-Control-Allow-Origin`, `*`)
            res.header(`Access-Control-Allow-Credentials`, true);
            res.header(`Access-Control-Allow-Methods`, [`GET`, `PUT`, `POST`, `DELETE`, `POST`]);
            res.header(`Access-Control-Allow-Headers`, `Origin, X-Requested-With, Content-Type, Accept`);

            // Use next() function to continue routing
            next();
        });

        
        //=> View engine configuration
        this.server.engine( `html`, ejs.renderFile );
        this.server.set(`view engine`, `html`);
        
        //=> Static path configuration: define `www` folder for backoffice static files
        this.server.set( `views`, __dirname + `/www` );
        this.server.use( express.static(path.join(__dirname, `www`)) );

        //=> Set body request with ExpressJS: BodyParser not needed (http://expressjs.com/fr/api.html#express.json)
        this.server.use(express.json({limit: `20mb`}));
        this.server.use(express.urlencoded({ extended: true }))

        // Set web push deteails
        webpush.setVapidDetails(
            `mailto:julien@dwsapp.io`,
            process.env.PUBLIC_KEY,
            process.env.PRIVATE_KEY
        );

        //=> Bind HTTP client request
        this.bindHttpRequest();
    }

    bindHttpRequest(){
        // Route to get subscriber list
        this.server.get(`/push/subscribers`, async (req, res) => {
            const subscribers = await fetch(`http://localhost:3000/subscribers`).then( data => data.json() );

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
        this.server.get(`/push/key`, (req, res) => {
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

        // Route to subscribe new user
        this.server.post(`/push/subscribe`, async (req, res) => {
            // Check subscriber
            const subscriber = await fetch(`http://localhost:3000/subscribers?endpoint=${req.body.endpoint}`).then( data => data.json() );
                
            // Check if subscriber is already registered
            if(subscriber.length === 0){
                // Set subscriber options
                const options = {
                    method: `POST`,
                    headers: { 'Content-Type': 'application/json'  },
                    body: JSON.stringify(req.body)
                }
                
                // Register new subscriber
                const newSubscriber = await fetch(`http://localhost:3000/subscribers`, options).then( data => data.json() );

                // Send push notification            
                await webpush.sendNotification(newSubscriber, JSON.stringify({
                    title: `DWSapp Push Notification`,
                    content: {
                        body: `Your subscription is active`,
                        icon: "/img/icon-72x72.png",
                    }
                }));

                // Debug
                console.log('New subscriber', { id : newSubscriber.id })

                // Send success request
                return res.status(200).json({
                    endpoint: req.originalUrl,
                    method: req.method,
                    message: `Your subscription is active`,
                    err: null,
                    data: newSubscriber,
                    status: 200
                });
            }
            else{
                // Send push notification            
                await webpush.sendNotification(newSubscriber, JSON.stringify({
                    title: `DWSapp Push Notification`,
                    body: `You are already registered`
                }));

                // Send success request
                return res.status(200).json({
                    endpoint: req.originalUrl,
                    method: req.method,
                    message: `You are already registered`,
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
            console.log({
                node: `http://localhost:${this.port}`,
            });
        });

        // Auto push notification
        this.autoPush();
    }

    async autoPush(){
        // Set auto push notification to all subscribers
        let idx = 0;
        setInterval(async () => {
            // Increment idx
            idx++;

            // Check subscriber
            const subscribers = await fetch(`http://localhost:3000/subscribers`).then( data => data.json() );

            // Loop on subscribers
            if(subscribers.length !== 0){
                for(let item of subscribers){
                    // Send push notification => https://developer.mozilla.org/fr/docs/Web/API/ServiceWorkerRegistration/showNotification
                    const notificationContent = {
                        title: `DWSapp Push Notification`,
                        content: {
                            body: `Auto push ${idx} to ${item.keys.auth}`,
                            badge: "/img/icon-72x72.png",
                            icon: "/img/icon-72x72.png",
                            image: "/img/icon-72x72.png",
                            lang: 'en',
                            silent: true,
                            timestamp: new Date(),
                            actions: [
                                {
                                    action: 'open-site',
                                    title: 'Open site',
                                },
                                {
                                    action: 'more-actions',
                                    title: 'More action',
                                }
                            ]
                        }
                    }

                    // Send push notification
                    webpush.sendNotification(item, JSON.stringify(notificationContent) )
                    .then( pushResponse => { 
                        console.log('Push Notification', { idx, status: pushResponse.statusCode }) 
                        console.log(pushResponse) 
                    })
                    .catch( async pushError => {
                        console.log(pushError)
                        // Check error
                        if(pushError.headers.connection.toUpperCase() === 'CLOSE'){
                            // Delete subscriber
                            await fetch(
                                `http://localhost:3000/subscribers/${item.id}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );
                            
                            // Debug
                            console.log('Delete subscriber', { id : item.id })
                        }
                    })
                }
            }
        }, 5000)
    }
}
//

/* 
Start server
*/
    const notificationApi = new ServerClass();
    notificationApi.init();
//