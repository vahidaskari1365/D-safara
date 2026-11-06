// Run against an isolated server with demo mode enabled (development by default).
import assert from "node:assert/strict";
const base = process.env.BASE_URL || "http://localhost:3000";
async function call(path, body, cookie) {
  const res = await fetch(base + path, { method: body ? "POST" : "GET", headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json(), cookie: res.headers.get("set-cookie")?.split(";")[0] };
}
assert.equal((await call("/api/auth")).data.demoMode, true);
for (const [role, api] of [["student", "/api/student?view=dashboard"], ["mentor", "/api/student?view=mentor-dashboard"], ["admin", "/api/admin?view=overview"]]) {
  const login = await call("/api/auth", { action: "demo-login", role });
  assert.equal(login.status, 200); assert.equal(login.data.user.role, role.toUpperCase());
  assert.ok(login.cookie); assert.equal((await call(api, null, login.cookie)).status, 200);
  await call("/api/auth", { action: "logout" }, login.cookie);
  assert.notEqual((await call(api, null, login.cookie)).status, 200);
}
const studentSession = await call("/api/auth", { action: "demo-login", role: "student" });
const switched = await call("/api/auth", { action: "demo-login", role: "admin" }, studentSession.cookie);
assert.equal(switched.status, 200);
assert.equal((await call("/api/student?view=dashboard", null, studentSession.cookie)).status, 401);
assert.equal((await call("/api/admin?view=overview", null, switched.cookie)).status, 200);
assert.equal((await call("/api/auth", { action: "demo-login", role: "__proto__" })).status, 400);
console.log("Demo role login smoke checks passed.");
