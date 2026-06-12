import { fetchApi } from "./lib/api-client.js"; // Can't easily use nextjs imports here...

// Let's just do a plain fetch to 5009 to see the raw data
const fetch = require('node-fetch'); // or native fetch if Node 18+

async function test() {
  try {
    const res = await fetch("http://localhost:5009/api/catalog/games/mlbb");
    const json = await res.json();
    console.log("Keys in data:", Object.keys(json.data));
    console.log("slug in data:", json.data.slug);
    console.log("name in data:", json.data.name);
  } catch (e) {
    console.error(e);
  }
}
test();
