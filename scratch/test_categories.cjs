const http = require('http');

async function test() {
  console.log("Logging in...");
  const loginRes = await fetch("http://localhost:5009/api/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@sassygurl.store", password: "SassyGurl@2026!" })
  });
  
  if (!loginRes.ok) {
    console.error("Login failed", await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  
  console.log("Fetching MLBB Game ID...");
  const gamesRes = await fetch("http://localhost:5009/api/Dashboard/admin/games", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  const gamesData = await gamesRes.json();
  const mlbb = gamesData.data.find(g => g.slug === 'mlbb');
  if (!mlbb) {
    console.log("MLBB not found");
    return;
  }
  
  const gameId = mlbb.id;
  console.log("MLBB Game ID:", gameId);
  
  console.log("Creating Category...");
  const createRes = await fetch(`http://localhost:5009/api/ProductCategories?gameId=${gameId}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Special Weekly Pass", icon: "💎", sortOrder: 1 })
  });
  
  if (!createRes.ok) {
    console.error("Create Category failed", await createRes.text());
    return;
  }
  
  const cat = await createRes.json();
  console.log("Created Category:", cat);
  
  console.log("Fetching Categories...");
  const getRes = await fetch(`http://localhost:5009/api/ProductCategories?gameId=${gameId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  const cats = await getRes.json();
  console.log("Categories:", cats);
  
  console.log("Assigning Product to Category...");
  // Get mlbb products
  const mlbbProductsRes = await fetch("http://localhost:5009/api/catalog/games/mlbb");
  const mlbbProductsData = await mlbbProductsRes.json();
  if (mlbbProductsData.data && mlbbProductsData.data.products && mlbbProductsData.data.products.length > 0) {
      const p1 = mlbbProductsData.data.products[0].id;
      const assignRes = await fetch(`http://localhost:5009/api/ProductCategories/${cats[0].id}/products?gameId=${gameId}`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify([p1])
      });
      console.log("Assign Result:", await assignRes.text());
  } else {
      console.log("No products found to assign");
  }

  console.log("Done");
}

test();
