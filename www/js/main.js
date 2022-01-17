/* 
Function to check Notification Permission
*/
  const checkNotificationPermission = () => {
    return new Promise( async (resolve, reject) => {
      // Check 'Notification' and 'ServiceWorker'
      if( 'Notification' in window && 'serviceWorker' in navigator ){
        // Get permission
        let permission = await Notification.requestPermission();
        
        //check permission
        if(permission === 'granted'){ return resolve(permission) }
        else{ return reject('You must accept web Notification') }
      }
      else{
        return reject('This browser does not support notifications.') 
      }
    })
  }
//

/* 
Function to register service worker
*/
  const registerServiceWorker = async () => {
    const workerRegistration = await navigator.serviceWorker.register('./service-worker.js');
    const subscription = await workerRegistration.pushManager.getSubscription();

    console.log('subscription', subscription)
  }
//


/* 
Start interface
*/
  document.addEventListener('DOMContentLoaded', () => {

    // Get user notification status
    checkNotificationPermission()
    .then( permission => {
      
      console.log('permission', permission)

      registerServiceWorker()

    })
    .catch( error => {
      console.log(error)
    })
  })
//