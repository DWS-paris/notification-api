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

        // Set web push details
        webpush.setVapidDetails(
            `mailto:julien@dwsapp.io`,
            process.env.PUBLIC_KEY,
            process.env.PRIVATE_KEY
        );

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

            // Define navigator service
            let navigatoreName = `webpush`;
            if( subscriber.endpoint.indexOf('googleapis') !== -1 ){ navigatoreName = 'googleapis' }
            else if( subscriber.endpoint.indexOf('services.mozilla') !== -1 ){ navigatoreName = 'services.mozilla' }

            // Send push notification
            await this.sendPushNotification(`DWSapp new notification`, `Hello from another navigator`, subscriber);

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
                let navigatoreName = `webpush`;
                if( newSubscriber.endpoint.indexOf('googleapis') !== -1 ){ navigatoreName = 'googleapis' }
                else if( newSubscriber.endpoint.indexOf('services.mozilla') !== -1 ){ navigatoreName = 'services.mozilla' }

                // Send push notification
                await this.sendPushNotification(`DWSapp subscription active`, `Subscribed ${navigatoreName} ${newSubscriber.id}`, newSubscriber);

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
                        let navigatoreName = `webpush`;
                        if( item.endpoint.indexOf('googleapis') !== -1 ){ navigatoreName = 'googleapis' }
                        else if( item.endpoint.indexOf('services.mozilla') !== -1 ){ navigatoreName = 'services.mozilla' }

                        // Send push notification
                        await this.sendPushNotification(`DWSapp new subscription`, `Subscribed ${navigatoreName} ${item.id}`, item);
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
                let navigatoreName = `webpush`;
                if( newSubscriber.endpoint.indexOf('googleapis') !== -1 ){ navigatoreName = 'googleapis' }
                else if( newSubscriber.endpoint.indexOf('services.mozilla') !== -1 ){ navigatoreName = 'services.mozilla' };

                // Send push notification
                await this.sendPushNotification(`DWSapp Push Notification`, `Already subscribed ${newSubscriber.id} with ${navigatoreName}`, newSubscriber);

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
            console.log({
                node: `http://localhost:${this.port}`,
            });
        });

        // Auto push notification
        //this.autoPush();
    }

    // Send push notification => https://developer.mozilla.org/fr/docs/Web/API/ServiceWorkerRegistration/showNotification
    async sendPushNotification(title, content, subscriber){
        // Set notification
        const notificationContent = {
            title: title,
            content: {
                body: content,
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
                    }
                ]
            }
        }

        // Send push notification
        webpush.sendNotification(subscriber, JSON.stringify(notificationContent) )
        .then( pushResponse => { 
            console.log('Push Notification', { status: pushResponse.statusCode }) 
        })
        .catch( async pushError => {
            // Check error
            if( pushError.body.indexOf('unsubscribed or expired') !== -1 ){
                console.log('unsubscribed or expired')
                // Delete subscriber
                await fetch(
                    `${process.env.JSON_SERVER_URL}/subscribers/${subscriber.id}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                // Debug
                console.log('Delete subscriber', { id : subscriber.id })
            }
        })
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
                        /* if(pushError.headers.connection.toUpperCase() === 'CLOSE'){
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
                        } */
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