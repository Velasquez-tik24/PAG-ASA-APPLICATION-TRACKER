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

    if (!email || !pwd) return showNotification("Email and password are required.");

    const user = store.users.find(u => u.email === email && u.password === pwd);
    if (!user) return showNotification("Invalid email or password.");

    currentUser = user;
    clearLoginForm();

    if (user.role === "admin") {
      showAdminPanel();
      showWindow("admin");
    } else {
      const applicant = store.applicants.find(a => a.email === user.email);
      if (applicant) {
        showApplicantStatus(user.email);
        editBtn.textContent = "Edit Information";
        saveBtn.classList.add("hidden");
        isEditing = false;
        showWindow("status");
      } else {
        showWindow("fillup");
      }
    }
  });

  /*  FILL UP  */

  const firstNameInp = document.getElementById("first-name");
  const middleNameInp = document.getElementById("middle-name");
  const lastNameInp = document.getElementById("last-name");
  const courseInp = document.getElementById("course");
  const sectionYearInp = document.getElementById("section-year");
  const gpaInp = document.getElementById("gpa");
  const trackBtn = document.getElementById("track-btn");

  trackBtn.addEventListener("click", () => {
    const first = firstNameInp.value.trim();
    const middle = middleNameInp.value.trim();
    const last = lastNameInp.value.trim();
    const course = courseInp.value.trim();
    const sectionYear = sectionYearInp.value.trim();
    const gpa = parseFloat(gpaInp.value);

    if (!first || !last || !course || !sectionYear || isNaN(gpa))
      return showNotification("Please fill out all fields properly.");

    const fullname = `${first} ${middle ? middle + " " : ""}${last}`;

    let existingApp = store.applicants.find(a => a.email === currentUser.email);

    if (existingApp) {
      existingApp.fullname = fullname;
      existingApp.course = course;
      existingApp.sectionYear = sectionYear;
      existingApp.gpa = gpa.toFixed(2);
      existingApp.status = "Pending...";
    } else {
      store.applicants.push({
        email: currentUser.email,
        fullname,
        course,
        sectionYear,
        gpa: gpa.toFixed(2),
        status: "Pending..."
      });
    }

    saveStore();
    showApplicantStatus(currentUser.email);
    editBtn.textContent = "Edit Information";
    saveBtn.classList.add("hidden");
    isEditing = false;
    showWindow("status");
  });

  /* STATUS */

  const statusResult = document.getElementById("status-result");
  const editBtn = document.getElementById("edit-btn");
  const saveBtn = document.getElementById("save-btn");
  let isEditing = false;

  function showApplicantStatus(email) {
    let applicant = store.applicants.find(a => a.email === email);
    if (!applicant) {
      statusResult.innerHTML = "<p>No application found.</p>";
      return;
    }
    statusResult.innerHTML = `
      <input type="text" id="status-fullname" value="${applicant.fullname}" readonly />
      <input type="text" id="status-course" value="${applicant.course}" readonly />
      <input type="text" id="status-sectionYear" value="${applicant.sectionYear}" readonly />
      <input type="number" id="status-gpa" min="0" max="5" step="0.01" value="${applicant.gpa}" readonly />
      <input type="text" id="status-status" value="${applicant.status}" readonly />
    `;
  }

  editBtn.addEventListener("click", () => {
    if (!isEditing) {
      // Enable editing for all except status
      document.getElementById("status-fullname").removeAttribute("readonly");
      document.getElementById("status-course").removeAttribute("readonly");
      document.getElementById("status-sectionYear").removeAttribute("readonly");
      document.getElementById("status-gpa").removeAttribute("readonly");
      // Status remains readonly
      editBtn.textContent = "Cancel Edit";
      saveBtn.classList.remove("hidden");
      isEditing = true;
    } else {
      // Cancel: Reload original data and disable editing
      showApplicantStatus(currentUser.email);
      editBtn.textContent = "Edit Information";
      saveBtn.classList.add("hidden");
      isEditing = false;
    }
  });

  saveBtn.addEventListener("click", () => {
    const fullname = document.getElementById("status-fullname").value.trim();
    const course = document.getElementById("status-course").value.trim();
    const sectionYear = document.getElementById("status-sectionYear").value.trim();
    const gpa = parseFloat(document.getElementById("status-gpa").value);

    // Validation (similar to fill-up)
    if (!fullname || !course || !sectionYear || isNaN(gpa)) {
      return showNotification("Please fill out all fields properly.");
    }

    // Update store
    const applicant = store.applicants.find(a => a.email === currentUser.email);
    applicant.fullname = fullname;
    applicant.course = course;
    applicant.sectionYear = sectionYear;
    applicant.gpa = gpa.toFixed(2);
    saveStore();

    // Exit edit mode
    showApplicantStatus(currentUser.email);
    editBtn.textContent = "Edit Information";
    saveBtn.classList.add("hidden");
    isEditing = false;
    showNotification("Information updated successfully!");
  });

  /*  ADMIN */

  const adminTableBody = document.querySelector("#applicants-table tbody");
  const adminLogoutBtn = document.getElementById("admin-logout");

  adminLogoutBtn.addEventListener("click", () => {
    currentUser = null;
    showWindow("login");
  });

  function sortApplicants() {
    store.applicants.sort((a, b) => {
      const gpaA = parseFloat(a.gpa);
      const gpaB = parseFloat(b.gpa);
      if (gpaA !== gpaB) return gpaA - gpaB;

      const matchA = a.sectionYear.match(/^(\d+)([A-Z])$/);
      const matchB = b.sectionYear.match(/^(\d+)([A-Z])$/);

      if (matchA && matchB) {
        const letterA = matchA[2];
        const letterB = matchB[2];
        if (letterA !== letterB) return letterA.localeCompare(letterB);
        const numA = parseInt(matchA[1]);
        const numB = parseInt(matchB[1]);
        return numA - numB;
      }
      return a.sectionYear.localeCompare(b.sectionYear);
    });
  }

  //  Search variable
  let searchQuery = "";

  // Search input listener — attaches only once
  const searchInput = document.getElementById("admin-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      showAdminPanel(); // Refresh
    });
  }

  function filterApplicants(applicants) {
    if (!searchQuery) return applicants;
    return applicants.filter(app =>
      app.fullname.toLowerCase().includes(searchQuery) ||
      app.course.toLowerCase().includes(searchQuery) ||
      app.sectionYear.toLowerCase().includes(searchQuery) ||
      app.gpa.includes(searchQuery) ||
      app.status.toLowerCase().includes(searchQuery)
    );
  }

  function showAdminPanel() {
    sortApplicants();
    adminTableBody.innerHTML = "";

    const filteredApplicants = filterApplicants(store.applicants);

    if (filteredApplicants.length === 0) {
      adminTableBody.innerHTML = `<tr><td colspan="7">No applicants found.</td></tr>`;
      return;
    }

    filteredApplicants.forEach(applicant => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><input class="input-admin" value="${applicant.fullname}" readonly></td>
        <td><input class="input-admin" value="${applicant.course}" readonly></td>
        <td><input class="input-admin" value="${applicant.sectionYear}" readonly></td>
        <td><input class="input-admin" value="${applicant.gpa}" readonly></td>
        <td><input class="input-admin" value="${applicant.status}" readonly></td>
        <td>
          <button class="btn-approve">APPROVE</button>
          <button class="btn-reject">REJECT</button>
          <button class="btn-delete">DELETE</button>
        </td>
      `;

      const approveBtn = tr.querySelector(".btn-approve");
      const rejectBtn = tr.querySelector(".btn-reject");
      const deleteBtn = tr.querySelector(".btn-delete");

      approveBtn.addEventListener("click", () => {
        const idx = store.applicants.findIndex(a => a.email === applicant.email);
        store.applicants[idx].status = "Approved";
        saveStore();
        showAdminPanel();
      });

      rejectBtn.addEventListener("click", () => {
        const idx = store.applicants.findIndex(a => a.email === applicant.email);
        store.applicants[idx].status = "Rejected";
        saveStore();
        showAdminPanel();
      });

      deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this applicant?")) {
          store.applicants = store.applicants.filter(a => a.email !== applicant.email);
          saveStore();
          showAdminPanel();
          showNotification("Applicant deleted successfully.");
        }
      });

      adminTableBody.appendChild(tr);
    });
  }

  /* LOGOUT HANDLERS */

  const logoutBtnFillup = document.getElementById("applicant-logout");
  const logoutBtnStatus = document.getElementById("applicant-logout-status");

  function logout() {
    currentUser = null;
    showWindow("login");
    showNotification("You have successfully logged out.", 2000);
  }

  if (logoutBtnFillup) logoutBtnFillup.addEventListener("click", logout);
  if (logoutBtnStatus) logoutBtnStatus.addEventListener("click", logout);

  // Default window
  showWindow("register");
})();
