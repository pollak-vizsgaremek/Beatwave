/**
 * scripts/repro-register.ts
 *
 * One-off development script to reproduce and test the registration endpoint.
 * Run with: npx tsx scripts/repro-register.ts
 *
 * NOT part of the production application — kept here for convenience.
 */
async function testRegister() {
  const user = {
    email: "unique_user_" + Date.now() + "@example.com",
    username: "unique_user_" + Date.now(),
    password: "Password123!",
  };

  try {
    console.log("Request 1 (Should succeed)...");
    let res = await fetch("http://localhost:6969/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    console.log("Status 1:", res.status);

    console.log("Request 2 (Should fail with 409)...");
    res = await fetch("http://localhost:6969/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    console.log("Status 2:", res.status);
    const text = await res.text();
    console.log("Body 2:", text);
  } catch (e) {
    console.error("Request failed:", e);
  }
}

testRegister();
