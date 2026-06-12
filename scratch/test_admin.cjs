async function test() {
  console.log("Logging in...");
  const loginRes = await fetch("http://localhost:5009/api/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@sassygurl.store", password: "SassyGurl@2026!" })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  
  console.log("Fetching MLBB Game ID...");
  const gamesRes = await fetch("http://localhost:5009/api/Dashboard/admin/games", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const gamesData = await gamesRes.json();
  const mlbb = gamesData.data.find(g => g.slug === 'mlbb');
  const gameId = mlbb.id;
  
  console.log("Fetching Admin Products for MLBB...");
  const pRes = await fetch(`http://localhost:5009/api/Products/game/${gameId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  const pData = await pRes.json();
  console.log("Products Count:", pData.data.length);
  if (pData.data.length > 0) {
    console.log("First Product:", pData.data[0]);
  }
}

test();
