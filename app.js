
// =============================
// GLOBAL STATE
// =============================

let currentUser = null;
let currentRole = null;

// =============================
// AUTH - REGISTER
// =============================

async function register(email, password, role) {
  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);

    await db.collection("users").doc(userCred.user.uid).set({
      role: role,
      email: email,
      created: Date.now()
    });

    console.log("User registered");
  } catch (err) {
    console.error(err.message);
    alert(err.message);
  }
}

// =============================
// AUTH - LOGIN
// =============================

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);

    const userDoc = await db.collection("users").doc(userCred.user.uid).get();

    currentUser = userCred.user;
    currentRole = userDoc.data().role;

    console.log("Logged in as:", currentRole);

  } catch (err) {
    alert(err.message);
  }
}

// =============================
// LOGOUT
// =============================

function logout() {
  auth.signOut();
  currentUser = null;
  currentRole = null;
}

// =============================
// AUTH STATE LISTENER
// =============================

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;

    const doc = await db.collection("users").doc(user.uid).get();
    currentRole = doc.data().role;

    console.log("Session restored:", currentRole);

    loadPosts();
    loadGallery();
  }
});

// =============================
// UPLOAD FILES (images/videos)
// =============================

async function uploadFile(file) {
  if (!file) return;

  const ref = storage.ref().child(`uploads/${Date.now()}_${file.name}`);

  await ref.put(file);
  const url = await ref.getDownloadURL();

  await db.collection("media").add({
    url: url,
    type: file.type,
    created: Date.now()
  });

  console.log("File uploaded");
}

// =============================
// CREATE POST
// =============================

async function createPost() {
  const text = document.getElementById("postText").value;

  if (!text) return;

  await db.collection("posts").add({
    text: text,
    role: currentRole,
    user: currentUser.email,
    created: Date.now()
  });

  document.getElementById("postText").value = "";
}

// =============================
// LOAD POSTS (REAL TIME)
// =============================

function loadPosts() {
  db.collection("posts")
    .orderBy("created", "desc")
    .onSnapshot(snapshot => {

      const container = document.getElementById("posts");
      if (!container) return;

      container.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();

        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
          <strong>${data.user}</strong>
          <small> (${data.role})</small>
          <p>${data.text}</p>
        `;

        container.appendChild(div);
      });
    });
}

// =============================
// LOAD GALLERY (REAL TIME)
// =============================

function loadGallery() {
  db.collection("media")
    .orderBy("created", "desc")
    .onSnapshot(snapshot => {

      const container = document.getElementById("gallery");
      if (!container) return;

      container.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();

        const card = document.createElement("div");
        card.className = "card";

        if (data.type.startsWith("image")) {
          const img = document.createElement("img");
          img.src = data.url;
          card.appendChild(img);
        } else {
          const video = document.createElement("video");
          video.src = data.url;
          video.controls = true;
          card.appendChild(video);
        }

        container.appendChild(card);
      });
    });
}

// =============================
// FILE INPUT HANDLER (if used in UI)
// =============================

function handleFileUpload() {
  const file = document.getElementById("file").files[0];
  uploadFile(file);
}
