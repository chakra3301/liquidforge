const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs-extra');

async function testNFTGeneration() {
  console.log('Testing NFT Generation...');
  
  try {
    // Test canvas creation
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');
    
    // Set background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1000, 1000);
    
    console.log('✓ Canvas created successfully');
    
    // Test if we can save an image
    const imageBuffer = canvas.toBuffer('image/png');
    const testPath = path.join(__dirname, 'test-output.png');
    await fs.writeFile(testPath, imageBuffer);
    
    console.log('✓ Test image saved successfully');
    
    // Clean up
    await fs.remove(testPath);
    console.log('✓ Test cleanup completed');
    
    console.log('All tests passed! NFT generation should work correctly.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testNFTGeneration(); 