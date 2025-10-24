const USERS = {
  "User_CEO":   { password: "ceo123" },
  "User_Sales": { password: "sales123" },
  "User_HR":    { password: "hr123" }
};

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  if (!u || !p) { msg.textContent = "Both fields required."; msg.className = "msg error"; return; }

  if (USERS[u] && USERS[u].password === p) {
    msg.textContent = "Login successful for " + u;
    msg.className = "msg success";
  } else {
    msg.textContent = "Invalid username or password.";
    msg.className = "msg error";
  }
});
