/* 
Function to check mandatory objects
*/
  const checkMandatoryies = () => {
    console.log('Notification', 'Notification' in window)
    console.log('serviceWorker', 'serviceWorker' in navigator)

    // Check 'Notification' and 'ServiceWorker'
    if( 'Notification' in window && 'serviceWorker' in navigator ){ return true }
    else{ return false };
  }
//

/* 
Function to get subscriber list
*/
  const getSubscribers = async () => {
    const apiResponse = await new FETCHrequest('/push/subscribers', 'GET').sendRequest();
    return apiResponse.data;
  }
//

/* 
Function to send subscriber list
*/
  const displaySubscribers = async list => {
    // Get subscribers from API
    const subscriberList = await getSubscribers();

    // Loop on subsciber list
    for(let item of subscriberList){
      // Create DOM elements
      let li = document.createElement('li');
      let button = document.createElement('button');
      button.innerText = `User ${item.id}`;

      // Bind click event
      button.addEventListener('click', () => {
        console.log(button)
      })

      // Append DOM elements
      li.appendChild(button)
      list.appendChild(li)
    }
  }
//

/* 
Function to register service worker
*/
  const registerServiceWorker = async () => {
    // Register service worker and get subscription
    const workerRegistration = await navigator.serviceWorker.register('./service-worker.js');
    let subscription = await workerRegistration.pushManager.getSubscription();

    // Check subscription
    if(!subscription){
      // Get notification public key
      const pushPublicKey = await new FETCHrequest('/push/key', 'GET').sendRequest();

      // Subscibe user
      subscription = await workerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: pushPublicKey.data
      })
      await new FETCHrequest('/push/subscribe', 'POST', subscription).sendRequest();
    }
  }
//


/* 
Start interface
*/
  document.addEventListener('DOMContentLoaded', async () => {
    

    // Declaration
    const permissionButton = document.querySelector('.permission-button');
    const subscriberList = document.querySelector('.subscriber-list');

    // Display subscribers
    await displaySubscribers(subscriberList);
    
    // Check navigator mandatories
    const navigatorIsReady = checkMandatoryies();

    // Check notification permission if navigator is ready
    let notificationPermission = Notification.permission;
    if(navigatorIsReady && notificationPermission !== 'granted'){
      // Display button
      permissionButton.classList.remove('hidden');

      // Bind click to set notification permission
      permissionButton.addEventListener('click', async () => {
        // Get permission
        let permission = await Notification.requestPermission();

        // Check permission
        if(permission === 'granted'){
          // Hide button
          permissionButton.classList.add('hidden');

          // Register service worker
          registerServiceWorker();
        }
      })
    }
    else if(navigatorIsReady && notificationPermission === 'granted'){
      // Register service worker
      await registerServiceWorker();
    }
  })
//