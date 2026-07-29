const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Colors
  content = content.replace(/slate/g, 'stone');

  // Radii - editorial is boxier
  content = content.replace(/rounded-2xl|rounded-xl|rounded-lg/g, 'rounded-none');
  
  // Headings font
  content = content.replace(/font-sans font-bold/g, 'font-display font-black');
  
  // Shadows to borders
  content = content.replace(/shadow-sm/g, 'shadow-none border-b-2 border-stone-800');
  
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
