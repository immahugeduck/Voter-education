const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Colors
  content = content.replace(/slate/g, 'stone');
  
  // Backgrounds: editorial style often relies on crisp white or stone-50 instead of stone-800
  // But let's just do slate->stone first for an earthy feel.

  // Radii - editorial is boxier
  content = content.replace(/rounded-2xl|rounded-xl|rounded-lg/g, 'rounded-none');
  
  // Headings font
  content = content.replace(/font-sans font-bold/g, 'font-display font-black');
  
  fs.writeFileSync(filePath, content);
}

const dir = './src/components';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx') && file !== 'Navigation.tsx') {
    updateFile(path.join(dir, file));
  }
});
updateFile('./src/App.tsx');
console.log("Done");
