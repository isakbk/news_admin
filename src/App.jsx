import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

const emptyEmployee = {
  full_name: "",
  email: "",
  phone: "",
  designation: "News Editor",
  is_active_employee: true,
};
const emptyAdmin = { username: "", email: "", password: "" };

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/admin/login/", form);
      localStorage.setItem("admin_access_token", data.access);
      localStorage.setItem("admin_refresh_token", data.refresh);
      onLogin(data.user);
    } catch (error) {
      setError(
        error.response?.data?.detail || "Invalid administrator credentials.",
      );
    }
  }
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand">
          <span>N</span> NEWSLINE <small>ADMIN</small>
        </div>
        <p className="eyebrow">CONTROL CENTER</p>
        <h1>Welcome back</h1>
        <p className="muted">Manage your newsroom team securely.</p>
        {error && <div className="alert error">{error}</div>}
        <label>
          Email or username
          <input
            required
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button className="button primary">Sign in to admin</button>
      </form>
    </main>
  );
}

function EmployeeForm({ employee, onClose, onSaved }) {
  const [form, setForm] = useState(employee || emptyEmployee);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const path = employee
        ? `/admin/employees/${employee.id}/`
        : "/admin/employees/";
      const { data } = employee
        ? await api.patch(path, form)
        : await api.post(path, form);
      onSaved(data);
      onClose();
    } catch (error) {
      setError(
        Object.values(error.response?.data || {}).flat()[0] ||
          "Could not save employee.",
      );
    }
  }
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">TEAM DIRECTORY</p>
            <h2>{employee ? "Edit employee" : "Add employee"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        {error && <div className="alert error">{error}</div>}
        <label>
          Full name
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Designation
            <input
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value })
              }
            />
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.is_active_employee ?? true}
            onChange={(e) =>
              setForm({ ...form, is_active_employee: e.target.checked })
            }
          />
          Active employee account
        </label>
        {!employee && (
          <p className="hint">
            Username is generated automatically. The first password is the same
            as the username.
          </p>
        )}
        <button className="button primary">
          {employee ? "Save changes" : "Create employee"}
        </button>
      </form>
    </div>
  );
}

function AdminCreate({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyAdmin);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    try {
      const { data } = await api.post("/admin/users/", form);
      onSaved(data);
    } catch (error) {
      setError(
        Object.values(error.response?.data || {}).flat()[0] ||
          "Could not create administrator.",
      );
    }
  }
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">ACCESS CONTROL</p>
            <h2>Add administrator</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        {error && <div className="alert error">{error}</div>}
        <label>
          Username
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            required
            minLength="8"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button className="button primary">Create administrator</button>
      </form>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("admin_user") || "null"),
  );
  const [tab, setTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(null);
  const [adminForm, setAdminForm] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (user)
      Promise.all([api.get("/admin/employees/"), api.get("/admin/users/")])
        .then(([employeesResponse, adminsResponse]) => {
          setEmployees(employeesResponse.data);
          setAdmins(adminsResponse.data);
        })
        .catch(() => setMessage("Unable to load administration data."));
  }, [user]);
  function login(nextUser) {
    localStorage.setItem("admin_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }
  function logout() {
    localStorage.clear();
    setUser(null);
  }
  async function removeEmployee(employee) {
    if (!confirm(`Delete ${employee.full_name}?`)) return;
    await api.delete(`/admin/employees/${employee.id}/`);
    setEmployees((items) => items.filter((item) => item.id !== employee.id));
  }
  async function removeAdmin(admin) {
    if (!confirm(`Delete administrator ${admin.username}?`)) return;
    await api.delete(`/admin/users/${admin.id}/`);
    setAdmins((items) => items.filter((item) => item.id !== admin.id));
  }
  if (!user) return <Login onLogin={login} />;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>N</span> NEWSLINE
        </div>
        <p className="sidebar-label">ADMINISTRATION</p>
        <button
          className={tab === "employees" ? "nav active" : "nav"}
          onClick={() => setTab("employees")}
        >
          People <b>{employees.length}</b>
        </button>
        <button
          className={tab === "admins" ? "nav active" : "nav"}
          onClick={() => setTab("admins")}
        >
          Administrators <b>{admins.length}</b>
        </button>
        <div className="sidebar-foot">
          <small>Signed in as</small>
          <strong>{user.username}</strong>
          <button className="logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">NEWSROOM CONTROL</p>
            <h1>
              {tab === "employees" ? "Employee directory" : "Administrators"}
            </h1>
            <p className="muted">
              {tab === "employees"
                ? "Create and manage staff access."
                : "Control who can access this panel."}
            </p>
          </div>
          <button
            className="button primary"
            onClick={() =>
              tab === "employees"
                ? setEmployeeForm(emptyEmployee)
                : setAdminForm(true)
            }
          >
            + {tab === "employees" ? "Add employee" : "Add administrator"}
          </button>
        </header>
        {message && <div className="alert error">{message}</div>}
        {tab === "employees" ? (
          <section className="panel">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Username</th>
                  <th>Designation</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <strong>{employee.full_name}</strong>
                      <small>{employee.email || "No email"}</small>
                    </td>
                    <td>
                      <code>{employee.employee_id}</code>
                    </td>
                    <td>
                      <code>{employee.username}</code>
                    </td>
                    <td>{employee.designation}</td>
                    <td>{employee.phone || "—"}</td>
                    <td>
                      <span
                        className={
                          employee.is_active_employee ? "status on" : "status"
                        }
                      >
                        {employee.is_active_employee ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="actions">
                      <button onClick={() => setEmployeeForm(employee)}>
                        Edit
                      </button>
                      <button
                        className="danger-text"
                        onClick={() => removeEmployee(employee)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!employees.length && (
              <div className="empty">
                No employees yet. Add your first newsroom employee.
              </div>
            )}
          </section>
        ) : (
          <section className="panel">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <strong>{admin.username}</strong>
                    </td>
                    <td>{admin.email || "—"}</td>
                    <td>{new Date(admin.date_joined).toLocaleDateString()}</td>
                    <td className="actions">
                      {admin.id !== user.id && (
                        <button
                          className="danger-text"
                          onClick={() => removeAdmin(admin)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {employeeForm && (
          <EmployeeForm
            employee={employeeForm.id ? employeeForm : null}
            onClose={() => setEmployeeForm(null)}
            onSaved={(saved) =>
              setEmployees((items) =>
                employeeForm.id
                  ? items.map((item) => (item.id === saved.id ? saved : item))
                  : [saved, ...items],
              )
            }
          />
        )}
        {adminForm && (
          <AdminCreate
            onClose={() => setAdminForm(false)}
            onSaved={(saved) => {
              setAdmins((items) => [...items, saved]);
              setAdminForm(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
