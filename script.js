(function() {
  // DOM Elements
  const windows = {
    register: document.getElementById("register-window"),
    login: document.getElementById("login-window"),
    fillup: document.getElementById("fillup-window"),
    status: document.getElementById("status-window"),
    admin: document.getElementById("admin-window"),
  };
  const notificationEl = document.getElementById("notification");

  // Show notification utility
  function showNotification(msg, timeout = 3000) {
    notificationEl.textContent = msg;
    notificationEl.style.display = "block";
    setTimeout(() => notificationEl.style.display = "none", timeout);
  }

  // JSON data store
  let store = JSON.parse(JSON.stringify(data));

  function saveStore() {
    localStorage.setItem("pagasaData", JSON.stringify(store));
  }
  function loadStore() {
    let d = localStorage.getItem("pagasaData");
    if (d) store = JSON.parse(d);
  }
  loadStore();

  let currentUser = null;

  // View controls
  function showWindow(name) {
    Object.keys(windows).forEach(w => {
      if (w === name) windows[w].classList.remove("hidden");
      else windows[w].classList.add("hidden");
    });
  }

  /* REGISTRATION  */

  const registerEmail = document.getElementById("register-email");
  const registerPassword = document.getElementById("register-password");
  const registerPasswordConfirm = document.getElementById("register-password-confirm");
  const registerBtn = document.getElementById("register-btn");
  const toLoginLink = document.getElementById("to-login");

  toLoginLink.addEventListener("click", e => {
    e.preventDefault();
    clearRegisterForm();
    showWindow("login");
  });

  function clearRegisterForm() {
    registerEmail.value = "";
    registerPassword.value = "";
    registerPasswordConfirm.value = "";
  }

  registerBtn.addEventListener("click", () => {
    const email = registerEmail.value.trim().toLowerCase();
    const pwd = registerPassword.value;
    const pwdC = registerPasswordConfirm.value;

    if (!email) return showNotification("Email is required.");
    if (!email.endsWith("@gmail.com"))
      return showNotification("Please enter a valid Gmail address.");
    if (!pwd) return showNotification("Password is required.");
    if (pwd !== pwdC) return showNotification("Passwords do not match.");

    if (store.users.find(u => u.email === email))
      return showNotification("Email already registered.");

    store.users.push({ email, password: pwd, role: "applicant" });
    saveStore();
    showNotification("Registration successful! Please log in.");
    clearRegisterForm();
    showWindow("login");
  });

  /*  LOGIN  */

  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");
  const toRegisterLink = document.getElementById("to-register");

  toRegisterLink.addEvent
