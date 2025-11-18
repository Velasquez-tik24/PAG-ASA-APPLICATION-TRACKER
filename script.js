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

  toRegisterLink.addEventListener("click", e => {
    e.preventDefault();
    clearLoginForm();
    showWindow("register");
  });

  function clearLoginForm() {
    loginEmail.value = "";
    loginPassword.value = "";
  }

  loginBtn.addEventListener("click", () => {
    const email = loginEmail.value.trim().toLowerCase();
    const pwd = loginPassword.value;

    const user = store.users.find(u => u.email === email && u.password === pwd);
    if (!user) return showNotification("Invalid email or password.");

    currentUser = user;
    clearLoginForm();
    if (user.role === "admin") {
      showWindow("admin");
      loadAdminTable();
    } else {
      const applicant = store.applicants.find(a => a.email === email);
      if (applicant) {
        showWindow("status");
        displayStatus(applicant);
      } else {
        showWindow("fillup");
      }
    }
  });

  /* FILLUP FORM */

  const firstName = document.getElementById("first-name");
  const middleName = document.getElementById("middle-name");
  const lastName = document.getElementById("last-name");
  const course = document.getElementById("course");
  const sectionYear = document.getElementById("section-year");
  const gpa = document.getElementById("gpa");
  const trackBtn = document.getElementById("track-btn");
  const applicantLogout = document.getElementById("applicant-logout");

  applicantLogout.addEventListener("click", () => {
    currentUser = null;
    showWindow("login");
  });

  trackBtn.addEventListener("click", () => {
    const fname = firstName.value.trim();
    const mname = middleName.value.trim();
    const lname = lastName.value.trim();
    const crs = course.value.trim();
    const secYr = sectionYear.value.trim();
    const gpaVal = parseFloat(gpa.value);

    if (!fname || !lname || !crs || !secYr || isNaN(gpaVal) || gpaVal < 0 || gpaVal > 5)
      return showNotification("Please fill all fields correctly. GPA must be 0-5.");

    const applicant = {
      email: currentUser.email,
      firstName: fname,
      middleName: mname,
      lastName: lname,
      course: crs,
      sectionYear: secYr,
      gpa: gpaVal,
      status: "Pending"
    };

    const existing = store.applicants.find(a => a.email === currentUser.email);
    if (existing) {
      Object.assign(existing, applicant);
    } else {
      store.applicants.push(applicant);
    }
    saveStore();
    showWindow("status");
    displayStatus(applicant);
  });

  /* STATUS WINDOW */

  const statusResult = document.getElementById("status-result");
  const editBtn = document.getElementById("edit-btn");
  const saveBtn = document.getElementById("save-btn");
  const applicantLogoutStatus = document.getElementById("applicant-logout-status");

  applicantLogoutStatus.addEventListener("click", () => {
    currentUser = null;
    showWindow("login");
  });

  function displayStatus(applicant) {
    statusResult.innerHTML = `
      <input type="text" value="${applicant.firstName}" readonly />
      <input type="text" value="${applicant.middleName}" readonly />
      <input type="text" value="${applicant.lastName}" readonly />
      <input type="text" value="${applicant.course}" readonly />
      <input type="text" value="${applicant.sectionYear}" readonly />
      <input type="number" value="${applicant.gpa}" readonly />
      <div>Status: ${applicant.status}</div>
    `;
  }

  editBtn.addEventListener("click", () => {
    const inputs = statusResult.querySelectorAll("input");
    inputs.forEach(input => input.removeAttribute("readonly"));
    editBtn.classList.add("hidden");
    saveBtn.classList.remove("hidden");
  });

  saveBtn.addEventListener("click", () => {
    const inputs = statusResult.querySelectorAll("input");
    const [fname, mname, lname, crs, secYr, gpaVal] = inputs;
    const gpaNum = parseFloat(gpaVal.value);

    if (!fname.value.trim() || !lname.value.trim() || !crs.value.trim() || !secYr.value.trim() || isNaN(gpaNum) || gpaNum < 0 || gpaNum > 5)
      return showNotification("Invalid data. GPA must be 0-5.");

    const applicant = store.applicants.find(a => a.email === currentUser.email);
    applicant.firstName = fname.value.trim();
    applicant.middleName = mname.value.trim();
    applicant.lastName = lname.value.trim();
    applicant.course = crs.value.trim();
    applicant.sectionYear = secYr.value.trim();
    applicant.gpa = gpaNum;
    saveStore();
    inputs.forEach(input => input.setAttribute("readonly", true));
    saveBtn.classList.add("hidden");
    editBtn.classList.remove("hidden");
    showNotification("Changes saved.");
  });

  /* ADMIN PANEL */

  const adminSearch = document.getElementById("admin-search");
  const applicantsTable = document.getElementById("applicants-table").querySelector("tbody");
  const adminLogout = document.getElementById("admin-logout");

  adminLogout.addEventListener("click", () => {
    currentUser = null;
    showWindow("login");
  });

  function loadAdminTable(filter = "") {
    applicantsTable.innerHTML = "";
    store.applicants.filter(a => a.firstName.toLowerCase().includes(filter.toLowerCase()) || a.lastName.toLowerCase().includes(filter.toLowerCase())).forEach(applicant => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${applicant.firstName} ${applicant.middleName} ${applicant.lastName}</td>
        <td>${applicant.course}</td>
        <td>${applicant.sectionYear}</td>
        <td>${applicant.gpa}</td>
        <td>${applicant.status}</td>
        <td>
          <button class="btn-approve" data-email="${applicant.email}">Approve</button>
          <button class="btn-reject" data-email="${applicant.email}">Reject</button>
          <button class="btn-delete" data-email="${applicant.email}">Delete</button>
        </td>
      `;
      applicantsTable.appendChild(row);
    });

    // Add event listeners for buttons
    document.querySelectorAll(".btn-approve").forEach(btn => {
      btn.addEventListener("click", () => {
        const email = btn.dataset.email;
        const applicant = store.applicants.find(a => a.email === email);
        applicant.status = "Approved";
        saveStore();
        loadAdminTable(adminSearch.value);
      });
    });
    document.querySelectorAll(".btn-reject").forEach(btn => {
      btn.addEventListener("click", () => {
        const email = btn.dataset.email;
        const applicant = store.applicants.find(a => a.email === email);
        applicant.status = "Rejected";
        saveStore();
        loadAdminTable(adminSearch.value);
      });
    });
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const email = btn.dataset.email;
        store.applicants = store.applicants.filter(a => a.email !== email);
        saveStore();
        loadAdminTable(adminSearch.value);
      });
    });
  }

  adminSearch.addEventListener("input", () => {
    loadAdminTable(adminSearch.value);
  });

  // Initial load
  showWindow("login");
})();
