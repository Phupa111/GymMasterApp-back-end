// Import the necessary Firebase modules
const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBP7ZNkLOif-Xu25TN2sHNECY9RDSjFMg",
  authDomain: "photogymmasterstorage.firebaseapp.com",
  projectId: "photogymmasterstorage",
  storageBucket: "photogymmasterstorage.appspot.com",
  messagingSenderId: "714378019811",
  appId: "1:714378019811:web:d28b4ba214ac7a61f356d6"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

module.exports = {
  app,storage
}
