// Run against an isolated `npm run dev` instance. This exercises the demo API;
// it is not a production security certification.
import assert from "node:assert/strict";
const base = process.env.BASE_URL || "http://localhost:3000";
async function call(path, body, cookie) {
  const response = await fetch(base + path, { method: body ? "POST" : "GET", headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
async function login(phone) {
  const otp = await call("/api/auth", { action: "request-otp", phone });
  assert.equal(otp.status, 200, "demo OTP must be available in development");
  const res = await call("/api/auth", { action: "verify-otp", phone, code: otp.data.devCode });
  assert.equal(res.status, 200); assert.ok(res.cookie); return res.cookie;
}
assert.equal((await call("/api/admin?view=overview", null, "ds_session=u_admin")).status, 403, "user IDs cannot be used as sessions");
const suffix = String(Date.now()).slice(-8);
const newUser = await login(`091${suffix}`);
const dashboard = await call("/api/student?view=dashboard", null, newUser);
assert.equal(dashboard.status, 200);
assert.equal(dashboard.data.enrollments.length, 0); assert.equal(dashboard.data.journal.length, 0);
const detail = await call("/api/public?section=course&slug=price-action-full");
assert.equal(detail.status, 200);
const lesson = detail.data.course.chapters[0].lessons[0];
assert.ok(!("videoUrl" in lesson));
assert.equal((await call("/api/student?view=course&slug=price-action-full", null, newUser)).status, 403);
assert.equal((await call("/api/student", { action: "complete-lesson", lessonId: lesson.id }, newUser)).status, 403);
assert.equal((await call("/api/student?view=exam&id=exam_1", null, newUser)).status, 403);
assert.equal((await call("/api/student", { action: "submit-exam", examId: "exam_1", answers: {} }, newUser)).status, 403);
assert.equal((await call("/api/student", { action: "submit-assignment", assignmentId: "asg_1", content: "A sufficiently long answer" }, newUser)).status, 403);
// In development, payment is explicitly a simulation. Retrying it must not duplicate effects.
const cartItem = { type: "course", slug: "price-action-full" };
assert.equal((await call("/api/checkout", { action: "create-order", items: [cartItem, cartItem] }, newUser)).status, 400);
const order = await call("/api/checkout", { action: "create-order", items: [cartItem] }, newUser);
assert.equal(order.status, 200);
const payBody = { action: "pay", orderId: order.data.order.id };
const concurrent = await Promise.all([call("/api/checkout", payBody, newUser), call("/api/checkout", payBody, newUser)]);
assert.ok(concurrent.some((response) => response.status === 200 && response.data.demo));
const retry = await call("/api/checkout", payBody, newUser);
assert.equal(retry.status, 200); assert.equal(retry.data.demo, true);
const account = await call("/api/student?view=orders", null, newUser);
assert.equal(account.data.transactions.filter((t) => t.type === "PURCHASE").length, 1);
assert.equal((await call("/api/student?view=course&slug=price-action-full", null, newUser)).status, 200);
const practice = await call("/api/student", { action: "submit-exam", examId: "exam_1", answers: { q_1: 1, q_2: 1, q_3: 1, q_4: 1 } }, newUser);
assert.equal(practice.status, 200);
assert.equal((await call("/api/student?view=certificates", null, newUser)).data.certificates.length, 0);
const student = await login("09123333333");
const exam = await call("/api/student?view=exam&id=exam_1", null, student);
assert.equal(exam.status, 200); assert.ok(exam.data.exam.questions.length);
assert.ok(exam.data.exam.questions.every((q) => !("answer" in q)));
const exams = await call("/api/student?view=exams", null, student);
assert.ok(exams.data.exams.every((e) => e.questions.every((q) => !("answer" in q))));
await call("/api/auth", { action: "logout" }, student);
assert.equal((await call("/api/student?view=dashboard", null, student)).status, 401, "logged out session must be revoked");
const admin = await login("09120000000");
const mentors = await call("/api/public?section=mentors");
const planSlug = mentors.data.plans[0].slug;
assert.equal((await call("/api/public", { action: "apply-mentoring", name: "Test Applicant", phone: `091${suffix}`, experience: "Test experience", planSlug })).status, 200);
const requests = await call("/api/admin?view=mentors", null, admin);
assert.ok(requests.data.planRequests.some((r) => r.applicantName === "Test Applicant" && r.applicantPhone === `091${suffix}` && !r.mentor));
console.log("Security smoke checks passed (development demo).");
