const fs = require('fs');
const path = require('path');

async function testUpload() {
  const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  
  const formData = new FormData();
  formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'test_pixel.png');

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log("Upload result:", data);
  } catch (err) {
    console.error("Upload error:", err);
  }
}

testUpload();
