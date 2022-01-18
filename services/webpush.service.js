/* 
Imports
*/
    const fetch = require('node-fetch'); //=> https://www.npmjs.com/package/node-fetch
    const webpush = require('web-push'); //=> https://www.npmjs.com/package/web-push
//

/* 
Function to init WebPush
=> https://developer.mozilla.org/fr/docs/Web/API/ServiceWorkerRegistration/showNotification
*/
    const initWebPush = async () => {
        webpush.setVapidDetails(
            `mailto:julien@dwsapp.io`,
            process.env.PUBLIC_KEY,
            process.env.PRIVATE_KEY
        );
    }
//

/* 
Function to define WebPush service
=> https://developer.mozilla.org/fr/docs/Web/API/ServiceWorkerRegistration/showNotification
*/
    const defineService = item => {
        // Set service name
        let navigatoreName = `webpush`;
        if( item.endpoint.indexOf('googleapis') !== -1 ){ navigatoreName = 'googleapis' }
        else if( item.endpoint.indexOf('services.mozilla') !== -1 ){ navigatoreName = 'services.mozilla' };

        console.log('navigatoreName', navigatoreName)
            
        return navigatoreName;
    }
//


/* 
Function to send Push Notification
=> https://developer.mozilla.org/fr/docs/Web/API/ServiceWorkerRegistration/showNotification

    @param{String}: title
    @param{String}: content
    @param{Subscriber}: subscriber
*/
    const sendPushNotification = async (title, content, subscriber, io) => {
        // Set notification
        const notificationContent = {
            title: title,
            content: {
                body: content,
                icon: `${process.env.API_URL}/img/icon-72x72.png`,
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
            if( pushError.body.indexOf('unsubscribed or expired') !== -1 || pushError.statusCode === 410){
                console.log(`${process.env.JSON_SERVER_URL}/subscribers/${subscriber.id}`)
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

                // Emit socket
                io.emit('delete-subsciption', JSON.stringify({ id: subscriber.id }));
                
                // Debug
                console.log('Delete subscriber', { id : subscriber.id })
            }
        })
    }
//

/* 
Function to push notification automaticaly
*/
    const autoPush = async (interval, io) => {
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
                    // Send push notification
                    await sendPushNotification(`DWSapp Push Notification`, `Auto push ${idx} to ${item.keys.auth}`, item, io);
                }
            }
        }, interval)
    }
//

/*
Export service fonctions
*/
    module.exports = {
        initWebPush,
        defineService,
        sendPushNotification,
        autoPush
    };
//