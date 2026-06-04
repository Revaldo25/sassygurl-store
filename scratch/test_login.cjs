const fetch = require('node-fetch');

async function test() {
    console.log("Testing Login API directly...");
    const res = await fetch("http://localhost:5009/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "login",
            method: "email",
            email: "puppeteer@test.com",
            password: "P@ssw0rd123!"
        })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}
test();
