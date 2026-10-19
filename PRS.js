// ======================================================
// PROJECT REPOSITORY SYSTEM - Department of Computer Science, IBBU Lapai
// Talks to the PHP/MySQL backend in /php. No localStorage is used.
// ======================================================

let csrfToken = "";
let editingId = null;
let userRole = "";
let filteredProjects = [];

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
    setupMenu();
    setupSearch();
    setupGridClicks();
    setupModal();
    setupLoginForm();
    setupProjectForm();
    setupTableClicks();
    setupStaffAccounts();
    setupChangePasswordForm();
    $("logoutBtn").addEventListener("click", logout);
    $("printReportBtn").addEventListener("click", printReport);

    loadProjects();
    checkLogin();
});

// ---------- helpers ----------

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function setMessage(id, text, success = false) {
    const message = $(id);
    message.textContent = text;
    message.classList.toggle("success", success && Boolean(text));
    message.classList.toggle("error", !success && Boolean(text));
}

// fetch wrapper: adds the CSRF header, parses JSON, handles expired sessions.
async function api(url, options = {}) {
    options.headers = Object.assign({}, options.headers, { "X-CSRF-Token": csrfToken });
    options.credentials = "same-origin";
    const response = await fetch(url, options);
    let data;
    try { data = await response.json(); }
    catch { throw new Error("Unexpected response from server."); }
    if (response.status === 401) setLoggedOut();
    return data;
}

// ---------- mobile menu ----------

function setupMenu() {
    $("menuBtn").addEventListener("click", () => $("navbar").classList.toggle("active"));
    $("navbar").addEventListener("click", (e) => {
        if (e.target.tagName === "A") $("navbar").classList.remove("active");
    });
}

// ---------- public: projects + search ----------

async function loadProjects() {
    const params = new URLSearchParams({
        q: $("searchInput").value.trim(),
        year: $("yearFilter").value,
        category: $("categoryFilter").value,
    });
    try {
        const data = await api(`php/get_projects.php?${params}`);
        if (!data.success) throw new Error(data.message);
        displayProjects(data.projects);
    } catch (error) {
        console.error(error);
        $("projectsGrid").innerHTML = "";
        $("noResults").style.display = "block";
        $("noResults").textContent = "Unable to load projects. Please try again.";
        $("resultCount").textContent = "";
    }
}

function displayProjects(projects) {
    filteredProjects = projects;
    const grid = $("projectsGrid");
    $("resultCount").textContent = `${projects.length} project${projects.length === 1 ? "" : "s"} found`;
    $("noResults").textContent = "No projects found.";
    $("noResults").style.display = projects.length ? "none" : "block";

    grid.innerHTML = projects.map((p) => {
        const text = p.description.length > 140 ? p.description.slice(0, 140) + "…" : p.description;
        return `
        <div class="project-card">
            <span class="project-category">${escapeHTML(p.category)}</span>
            <h3>${escapeHTML(p.title)}</h3>
            <p>${escapeHTML(text)}</p>
            <div class="project-meta">
                <p><strong>Student:</strong> ${escapeHTML(p.student_name)}</p>
                <p><strong>Supervisor:</strong> ${escapeHTML(p.supervisor)}</p>
                <p><strong>Year:</strong> ${escapeHTML(p.year)}</p>
            </div>
            <button class="view-btn" data-id="${p.id}">View Details</button>
        </div>`;
    }).join("");
}

function printReport() {
    const printedAt = new Date().toLocaleString();
    $("printReportCount").textContent = filteredProjects.length;
    $("printReportDate").textContent = printedAt;
    $("printReportDate").dateTime = new Date().toISOString();
    $("printReportTable").innerHTML = filteredProjects.length ? filteredProjects.map((project) => `
        <tr>
            <td>${escapeHTML(project.title)}</td>
            <td>${escapeHTML(project.student_name)}</td>
            <td>${escapeHTML(project.supervisor)}</td>
            <td>${escapeHTML(project.year)}</td>
            <td>${escapeHTML(project.category)}</td>
        </tr>`).join("") : `<tr><td colspan="5">No projects match the current filters.</td></tr>`;
    window.print();
}

function setupSearch() {
    let timer;
    $("searchInput").addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(loadProjects, 300);
    });
    $("searchInput").addEventListener("keydown", (e) => { if (e.key === "Enter") loadProjects(); });
    $("searchBtn").addEventListener("click", () => {
        loadProjects();
        $("projects").scrollIntoView();
    });
    $("yearFilter").addEventListener("change", loadProjects);
    $("categoryFilter").addEventListener("change", loadProjects);
}

function setupGridClicks() {
    $("projectsGrid").addEventListener("click", (e) => {
        const btn = e.target.closest(".view-btn");
        if (btn) viewProject(btn.dataset.id);
    });
}

// ---------- modal ----------

async function viewProject(id) {
    setMessage("modalMessage", "");
    try {
        const data = await api(`php/get_project.php?id=${encodeURIComponent(id)}`);
        if (!data.success) throw new Error(data.message);
        const p = data.project;
        $("modalCategory").textContent = p.category.toUpperCase();
        $("modalTitle").textContent = p.title;
        $("modalStudent").textContent = p.student_name;
        $("modalSupervisor").textContent = p.supervisor;
        $("modalYear").textContent = p.year;
        $("modalAbstract").textContent = p.description;
        const dl = $("modalDownload");
        dl.style.display = p.has_file ? "inline-block" : "none";
        dl.href = `php/download_project.php?id=${encodeURIComponent(p.id)}`;
        $("projectModal").classList.add("active");
    } catch (error) {
        console.error(error);
        setMessage("modalMessage", error.message || "Unable to load project details.");
        $("projectModal").classList.add("active");
    }
}

function setupModal() {
    const close = () => $("projectModal").classList.remove("active");
    $("closeModal").addEventListener("click", close);
    $("projectModal").addEventListener("click", (e) => { if (e.target === $("projectModal")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

// ---------- staff: session, login, logout ----------

async function checkLogin() {
    try {
        const data = await api("php/check_session.php");
        if (data.loggedIn) setLoggedIn(data); else setLoggedOut();
    } catch (error) {
        console.error("Session check failed:", error);
    }
}

function setLoggedIn(data) {
    csrfToken = data.csrf || csrfToken;
    userRole = data.role || "";
    $("staff").style.display = "none";
    $("dashboard").style.display = "block";
    $("staffAccounts").hidden = userRole !== "admin";
    const link = document.querySelector(".staff-link");
    link.textContent = "Dashboard";
    link.setAttribute("href", "#dashboard");
    refreshDashboard();
    if (userRole === "admin") loadStaffAccounts();
}

function setLoggedOut() {
    csrfToken = "";
    userRole = "";
    $("dashboard").style.display = "none";
    $("staffAccounts").hidden = true;
    $("staff").style.display = "";
    const link = document.querySelector(".staff-link");
    link.textContent = "Staff Login";
    link.setAttribute("href", "#staff");
}

function setupStaffAccounts() {
    const form = $("staffAccountForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const body = new FormData();
        body.append("fullname", $("accountFullname").value.trim());
        body.append("username", $("accountUsername").value.trim());
        body.append("password", $("accountPassword").value);
        setMessage("staffAccountMessage", "");
        submit.disabled = true;

        try {
            const data = await api("php/register.php", { method: "POST", body });
            if (!data.success) {
                setMessage("staffAccountMessage", data.message);
                return;
            }
            form.reset();
            setMessage("staffAccountMessage", "Staff account created successfully.", true);
            loadStaffAccounts();
        } catch (error) {
            console.error(error);
            setMessage("staffAccountMessage", "Unable to create staff account. Please try again.");
        } finally {
            submit.disabled = false;
        }
    });

    $("staffTable").addEventListener("click", (e) => {
        const button = e.target.closest(".delete-btn");
        if (button) deleteStaffAccount(button.dataset.id);
    });
}

function setupChangePasswordForm() {
    const form = $("changePasswordForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const body = new FormData();
        body.append("current_password", $("currentPassword").value);
        body.append("new_password", $("newPassword").value);
        setMessage("passwordMessage", "");
        submit.disabled = true;

        try {
            const data = await api("php/change_password.php", { method: "POST", body });
            if (!data.success) {
                setMessage("passwordMessage", data.message);
                return;
            }
            form.reset();
            setMessage("passwordMessage", "Password changed successfully.", true);
        } catch (error) {
            console.error(error);
            setMessage("passwordMessage", "Unable to change password. Please try again.");
        } finally {
            submit.disabled = false;
        }
    });
}

async function loadStaffAccounts() {
    try {
        const data = await api("php/users.php");
        if (!data.success) throw new Error(data.message);
        $("staffTable").innerHTML = data.users.length ? data.users.map((staff) => `
            <tr>
                <td>${escapeHTML(staff.fullname)}</td>
                <td>${escapeHTML(staff.username)}</td>
                <td><button class="delete-btn" data-id="${escapeHTML(staff.id)}">Delete</button></td>
            </tr>`).join("") : `<tr><td colspan="3">No staff accounts yet.</td></tr>`;
    } catch (error) {
        console.error(error);
        setMessage("staffAccountMessage", error.message || "Unable to load staff accounts.");
    }
}

async function deleteStaffAccount(id) {
    if (!confirm("Are you sure you want to delete this staff account?")) return;
    const body = new FormData();
    body.append("id", id);
    try {
        const data = await api("php/users.php", { method: "POST", body });
        if (!data.success) {
            setMessage("staffAccountMessage", data.message);
            return;
        }
        setMessage("staffAccountMessage", "Staff account deleted successfully.", true);
        loadStaffAccounts();
    } catch (error) {
        console.error(error);
        setMessage("staffAccountMessage", "Unable to delete staff account. Please try again.");
    }
}

function setupLoginForm() {
    const form = $("loginForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        setMessage("loginMessage", "Signing in…");

        const body = new FormData();
        body.append("username", $("username").value.trim());
        body.append("password", $("password").value);
        submit.disabled = true;
        try {
            const data = await api("php/login.php", { method: "POST", body });
            if (!data.success) {
                setMessage("loginMessage", data.message);
                return;
            }
            setMessage("loginMessage", "");
            form.reset();
            setLoggedIn(data);
            $("dashboard").scrollIntoView();
        } catch (error) {
            console.error(error);
            setMessage("loginMessage", "Unable to log in. Please try again.");
        } finally {
            submit.disabled = false;
        }
    });
}

async function logout() {
    try { await api("php/logout.php"); } catch (error) { console.error(error); }
    resetForm();
    setLoggedOut();
    $("home").scrollIntoView();
}

// ---------- staff: dashboard (stats + table) ----------

async function refreshDashboard() {
    try {
        const data = await api("php/get_projects.php");
        if (!data.success) return;
        const list = data.projects;
        const count = (cat) => list.filter((p) => p.category === cat).length;

        $("totalProjects").textContent = list.length;
        $("webProjects").textContent = count("Web Development");
        $("aiProjects").textContent = count("Artificial Intelligence");
        $("databaseProjects").textContent = count("Database");

        $("projectTable").innerHTML = list.length ? list.map((p) => `
            <tr>
                <td>${escapeHTML(p.title)}${p.has_file ? " 📎" : ""}</td>
                <td>${escapeHTML(p.student_name)}</td>
                <td>${escapeHTML(p.year)}</td>
                <td>${escapeHTML(p.category)}</td>
                <td>
                    <button class="view-btn edit-btn" style="width:auto;padding:7px 12px" data-id="${p.id}">Edit</button>
                    <button class="delete-btn" data-id="${p.id}">Delete</button>
                </td>
            </tr>`).join("")
            : `<tr><td colspan="5">No projects yet.</td></tr>`;
    } catch (error) {
        console.error(error);
    }
}

function setupTableClicks() {
    $("projectTable").addEventListener("click", (e) => {
        const edit = e.target.closest(".edit-btn");
        const del = e.target.closest(".delete-btn");
        if (edit) editProject(edit.dataset.id);
        if (del) deleteProject(del.dataset.id);
    });
}

// ---------- staff: add / edit / delete ----------

function setupProjectForm() {
    const form = $("projectForm");
    const submit = form.querySelector('button[type="submit"]');

    // "Cancel edit" button, shown only while editing
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.id = "cancelEdit";
    cancel.className = "view-btn";
    cancel.style.cssText = "display:none;width:max-content;padding:13px 23px";
    cancel.textContent = "Cancel Edit";
    cancel.addEventListener("click", resetForm);
    form.appendChild(cancel);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMessage("projectMessage", "");
        submit.disabled = true;
        const body = new FormData();
        body.append("title", $("projectTitle").value);
        body.append("student_name", $("studentName").value);
        body.append("supervisor", $("supervisor").value);
        body.append("year", $("projectYear").value);
        body.append("category", $("projectCategory").value);
        body.append("description", $("projectAbstract").value);
        const file = $("projectFile").files[0];
        if (file) body.append("project_file", file);
        if (editingId) body.append("id", editingId);

        try {
            const data = await api(editingId ? "php/update_project.php" : "php/add_project.php", { method: "POST", body });
            if (!data.success) {
                setMessage("projectMessage", data.message);
                return;
            }
            setMessage("projectMessage", editingId ? "Project updated successfully." : "Project added successfully.", true);
            resetForm();
            refreshDashboard();
            loadProjects();
        } catch (error) {
            console.error(error);
            setMessage("projectMessage", "An error occurred while saving the project.");
        } finally {
            submit.disabled = false;
        }
    });
}

function resetForm() {
    editingId = null;
    $("projectForm").reset();
    $("projectForm").querySelector("button[type=submit]").textContent = "Add Project";
    $("cancelEdit").style.display = "none";
    document.querySelector(".add-project h3").textContent = "Add New Project";
}

async function editProject(id) {
    try {
        const data = await api(`php/get_project.php?id=${encodeURIComponent(id)}`);
        if (!data.success) throw new Error(data.message);
        const p = data.project;
        editingId = p.id;
        $("projectTitle").value = p.title;
        $("studentName").value = p.student_name;
        $("supervisor").value = p.supervisor;
        $("projectYear").value = p.year;
        $("projectCategory").value = p.category;
        $("projectAbstract").value = p.description;
        $("projectFile").value = "";
        $("projectForm").querySelector("button[type=submit]").textContent = "Update Project";
        $("cancelEdit").style.display = "inline-block";
        document.querySelector(".add-project h3").textContent = "Edit Project (choose a file only to replace the current report)";
        document.querySelector(".add-project").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        console.error(error);
        setMessage("projectMessage", error.message || "Unable to load project.");
    }
}

async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    const body = new FormData();
    body.append("id", id);
    try {
        const data = await api("php/delete_project.php", { method: "POST", body });
        if (!data.success) {
            setMessage("projectMessage", data.message);
            return;
        }
        if (String(editingId) === String(id)) resetForm();
        setMessage("projectMessage", "Project deleted successfully.", true);
        refreshDashboard();
        loadProjects();
    } catch (error) {
        console.error(error);
        setMessage("projectMessage", "Unable to delete project.");
    }
}
