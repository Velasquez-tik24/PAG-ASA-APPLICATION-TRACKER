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

  // JSON data store (will mutate)
  let store = JSON.parse(JSON.stringify(data)); // deep copy from embedded script

  // Save data to localStorage to persist across refresh - demo purpose
  function saveStore() {
    localStorage.setItem('pagasaData', JSON.stringify(store));
  }
  function loadStore() {
    let d = localStorage.getItem('pagasaData');
    if(d) {
      store = JSON.parse(d);
    }
  }
  loadStore();

  // User session - store logged in user
  let currentUser = null;

  // Helper: View controls
  function showWindow(name) {
    Object.keys(windows).forEach(w => {
      if(w === name) windows[w].classList.remove('hidden');
      else windows[w].classList.add('hidden');
    });
  }

  // Registration form handlers
  const registerEmail = document.getElementById("register-email");
  const registerPassword = document.getElementById("register-password");
  const registerPasswordConfirm = document.getElementById("register-password-confirm");
  const registerBtn = document.getElementById("register-btn");
  const toLoginLink = document.getElementById("to-login");

  toLoginLink.addEventListener("click", e => {
    e.preventDefault();
    clearRegisterForm();
    showWindow('login');
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
    // Validations
    if(!email) {
      showNotification("Email is required.");
      return;
    }
    if(!email.endsWith("@gmail.com")) {
      showNotification("Please enter a valid Gmail address.");
      return;
    }
    if(!pwd) {
      showNotification("Password is required.");
      return;
    }
    if(pwd !== pwdC) {
      showNotification("Passwords do not match.");
      return;
    }
    // Check if user already exists
    if(store.users.find(u => u.email === email)) {
      showNotification("Email already registered.");
      return;
    }
    // Save new user with role applicant
    store.users.push({ email, password: pwd, role: "applicant" });
    saveStore();
    showNotification("Registration successful! Please log in.");
    clearRegisterForm();
    showWindow('login');
  });

  // Login form handlers
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");
  const toRegisterLink = document.getElementById("to-register");

  toRegisterLink.addEventListener("click", e => {
    e.preventDefault();
    clearLoginForm();
    showWindow('register');
  });

  function clearLoginForm() {
    loginEmail.value = "";
    loginPassword.value = "";
  }

  loginBtn.addEventListener("click", () => {
    const email = loginEmail.value.trim().toLowerCase();
    const pwd = loginPassword.value;
    if(!email || !pwd) {
      showNotification("Email and password are required.");
      return;
    }
    const user = store.users.find(u => u.email === email && u.password === pwd);
    if(!user) {
      showNotification("Invalid email or password.");
      return;
    }
    currentUser = user;
    clearLoginForm();
    if(user.role === "admin") {
      showAdminPanel();
      showWindow("admin");
    } else {
      // If applicant already submitted fill up form, show status window with updated status
      const applicant = store.applicants.find(a => a.email === user.email);
      if(applicant) {
        showApplicantStatus(user.email);
        showWindow("status");
      } else {
        showWindow("fillup");
      }
    }
  });

  // Fill-up form handlers
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

    if(!first || !last || !course || !sectionYear || isNaN(gpa)) {
      showNotification("Please fill out all fields properly.");
      return;
    }
    // Compose fullname
    const fullname = `${first} ${middle ? middle + " " : ""}${last}`;
    // Save application for current user email
    let existingApp = store.applicants.find(a => a.email === currentUser.email);
    if(existingApp) {
      // Update existing - reset status to Pending for any changes by applicant
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
    // Show status window with applicant data (including latest admin status)
    showApplicantStatus(currentUser.email);
    showWindow("status");
  });

  // Status Window
  const statusResult = document.getElementById("status-result");
  function showApplicantStatus(email) {
    let applicant = store.applicants.find(a => a.email === email);
    if(!applicant) {
      statusResult.innerHTML = "<p>No application found.</p>";
      return;
    }
    statusResult.innerHTML = `
      <input type="text" readonly value="${applicant.fullname}" />
      <input type="text" readonly value="${applicant.course}" />
      <input type="text" readonly value="${applicant.sectionYear}" />
      <input type="text" readonly value="${applicant.gpa}" />
      <input type="text" readonly value="${applicant.status}" />
    `;
  }

  // Admin Panel Handlers
  const adminTableBody = document.querySelector("#applicants-table tbody");
  const adminLogoutBtn = document.getElementById("admin-logout");

  adminLogoutBtn.addEventListener("click", () => {
    currentUser = null;
    showWindow('login');
  });

  function showAdminPanel() {
    // Clear existing rows
    adminTableBody.innerHTML = "";
    if(store.applicants.length === 0) {
      adminTableBody.innerHTML = `<tr><td colspan="6">No applicants.</td></tr>`;
      return;
    }
    store.applicants.forEach((applicant, idx) => {
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
        </td>
      `;

      // Button handlers for approve/reject
      const approveBtn = tr.querySelector(".btn-approve");
      const rejectBtn = tr.querySelector(".btn-reject");

      approveBtn.addEventListener("click", () => {
        store.applicants[idx].status = "Approved";
        saveStore();
        showAdminPanel();
      });

      rejectBtn.addEventListener("click", () => {
        store.applicants[idx].status = "Rejected";
        saveStore();
        showAdminPanel();
      });

      adminTableBody.appendChild(tr);
    });
  }

  // On page load, start with register window by default
  showWindow('register');

})();