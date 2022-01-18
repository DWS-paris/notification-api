// Use the last version of the service worker
self.addEventListener('install', () => self.skipWaiting() )

/* 
Bind the push event
This event binder is used to get web notification
*/
    self.addEventListener('push', event => {
        // Extract JSON data
        const pushData = event.data ? event.data.json() : undefined;

        // Display notification
        if(pushData){
            // Wait for notification notification
            event.waitUntil(
                // Display notification
                self.registration.showNotification(
                    pushData.title,
                    pushData.content
                )
            )
        }
    })
//

/* 
Bind notificationclick event
The event binder is used to get click on notification
*/
    self.addEventListener('notificationclick', event => {
        // Close notification
        event.notification.close();
        
        // Check click type
        if(event.action){
            // Check action
            if( event.action === 'open-site' ){
                // Redirect user to main client page
                event.waitUntil( openUrl('http://localhost:5437/') )
            }
            else if( event.action === 'more-actions' ){
                // Redirect user to DWSapp
                event.waitUntil( openUrl('https://dwsapp.io/') )
            }
        }
    })
//

/* 
Function to open url or focus on opened one
*/  
    const openUrl = async url => {
        // Get all opened windows
        const clientWindows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        // Check opened window to get focus
        let isFocused = false;
        for( let i = 0; i < clientWindows.length; i++ ){
            // Check client data
            const client = clientWindows[i];
            if(client.url === url && 'focus' in client){
                // focus on opened page
                isFocused = true;
                return client.focus();
            }
        }

        // Check if client can open window
        if(!isFocused && self.clients.openWindow){ return self.clients.openWindow(url) }
        else{ return null };
    }
//