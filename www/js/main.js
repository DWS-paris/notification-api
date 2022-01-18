/* 
Function to check mandatory objects
*/
  const checkMandatoryies = (info) => {
    // Check 'Notification' and 'ServiceWorker'
    let isReady = false
    if( 'Notification' in window === false ){ info.innerText = `push notification are not supported` }
    if( 'serviceWorker' in navigator === false ){ info.innerText = `service workers are not supported` }
    else if( 'Notification' in window && 'serviceWorker' in navigator ){ 
      info.innerText = `web navigator is ready`;
      isReady = true;
    }

    // Return validation
    return isReady;
  }
//

/* 
Function to set socketClient
*/
  const initSocketClient = async (subscriberList) => {
    // Create socket client
    const socket = io();

    // Bind 'new-subsciption' emitter
    socket.on('new-subsciption', msg => {
      // Parse Json
      const jsonResponse = JSON.parse(msg)

      // Append DOM elements
      let li = document.createElement('li');
      li.appendChild( addButton('subscriber-id', jsonResponse.id, `User ${jsonResponse.navigator} ${jsonResponse.id}`) )
      subscriberList.appendChild(li)
    });
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
      // Define navigator service
      let navigatoreName = `webpush`;
      if( item.endpoint.indexOf('googleapis') !== -1 ){ navigatoreName = 'googleapis' }
      else if( item.endpoint.indexOf('services.mozilla') !== -1 ){ navigatoreName = 'services.mozilla' };

      // Append DOM elements
      let li = document.createElement('li');
      li.appendChild( addButton('subscriber-id', item.id, `User ${navigatoreName} ${item.id}`) )
      list.appendChild(li)
    }
  }
//

/* 
Function to create DOM button
*/
  const addButton = (attribute, id, content) => {
    // Set button content
    let button = document.createElement('button');
    button.setAttribute(attribute, id)
    button.innerText = content;

    // Bind click event
    button.addEventListener('click', async () => {
      // Send push notification within the API
      await new FETCHrequest('/push/notification', 'POST', { subscriber: button.getAttribute('subscriber-id') }).sendRequest();
    })

    // Return DOM elements
    return button;
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
    const headerInfo = document.querySelector('.header-info');

    // Init Socket Client
    initSocketClient(subscriberList);

    // Display subscribers
    await displaySubscribers(subscriberList);
    
    // Check navigator mandatories
    const navigatorIsReady = checkMandatoryies(headerInfo);

    // Check notification permission if navigator is ready
    let notificationPermission = Notification.permission;
    if(navigatorIsReady && notificationPermission !== 'granted'){
      // Bind click to set notification permission
      permissionButton.addEventListener('click', async () => {
        // Get permission
        let permission = await Notification.requestPermission();

        // Check permission
        if(permission === 'granted'){
          // Hide button
          permissionButton.innerHTML = `Notification <b>enabled</b>`
          permissionButton.disabled = true;

          // Register service worker
          registerServiceWorker();
        }
      })
    }
    else if(navigatorIsReady && notificationPermission === 'granted'){
      // Register service worker
      await registerServiceWorker();

      // Hide button
      permissionButton.innerHTML = `Notification <b>enabled</b>`
      permissionButton.disabled = true;
    }
  })
//