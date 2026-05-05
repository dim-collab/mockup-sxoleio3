// 🔥 ΒΑΛΕ ΤΟ FIREBASE CONFIG ΣΟΥ
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
  storageBucket: "YOUR_BUCKET",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;
let role = null;

// ================= AUTH =================

async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const roleValue = document.getElementById('role').value;

  if (!email || !password) return alert('Συμπλήρωσε όλα τα πεδία');

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(userCred.user.uid).set({ role: roleValue });
  } catch (err) {
    alert(err.message);
  }
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    const doc = await db.collection('users').doc(userCred.user.uid).get();
    role = doc.data().role;
  } catch (err) {
    alert(err.message);
  }
}

function logout() {
  auth.signOut();
}

// ================= AUTH STATE =================

auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;

    const doc = await db.collection('users').doc(user.uid).get();
    role = doc.data().role;

    loadPostsRealtime();
  }
});

// ================= UPLOAD =================

async function upload() {
  const file = document.getElementById('file').files[0];
  if (!file) return;

  const ref = storage.ref().child(Date.now() + '_' + file.name);

  await ref.put(file);
  const url = await ref.getDownloadURL();

  await db.collection('media').add({ url, type: file.type });
}

// ================= GALLERY =================

db.collection('media').onSnapshot(snapshot => {
  const container = document.getElementById('gallery');
  container.innerHTML = '';

  snapshot.forEach(doc => {
    const data = doc.data();
    const card = document.createElement('div');
    card.className = 'card';

    let el;
    if (data.type.startsWith('image')) {
      el = document.createElement('img');
    } else {
      el = document.createElement('video');
      el.controls = true;
    }

    el.src = data.url;
    card.appendChild(el);
    container.appendChild(card);
  });
});

// ================= POSTS =================

async function createPost() {
  const text = document.getElementById('postText').value;
  if (!text) return;

  await db.collection('posts').add({
    text,
    role,
    user: currentUser.email,
    created: Date.now()
  });
}

function loadPostsRealtime() {
  db.collection('posts')
    .orderBy('created','desc')
    .onSnapshot(snapshot => {
      const container = document.getElementById('posts');
      container.innerHTML = '';

      snapshot.forEach(doc => {
        const data = doc.data();

        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
          <strong>${data.user}</strong><br>
          <small>${data.role}</small>
          <p>${data.text}</p>
        `;

        container.appendChild(card);
      });
    });
}
