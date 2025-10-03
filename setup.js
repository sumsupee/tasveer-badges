const fs = require('fs');
const path = require('path');

const filesToCopy = [
  'template_TFFM.pdf',
  'template_TFF.pdf',
  'template_TFM.pdf',
  'BebasNeue-Regular.ttf'
];

const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✓ Created public directory');
}

filesToCopy.forEach(file => {
  const sourcePath = path.join(__dirname, '..', file);
  const destPath = path.join(publicDir, file);

  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ Copied ${file}`);
    } else {
      console.warn(`⚠ Warning: ${file} not found in parent directory`);
    }
  } catch (error) {
    console.error(`✗ Error copying ${file}:`, error.message);
  }
});

console.log('\n✓ Setup complete! Run "npm run dev" to start the development server.');

