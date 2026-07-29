const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace standard modern cards with editorial cards
content = content.replace(/bg-white rounded-none border border-stone-200 p-6 shadow-none border-b-2 border-stone-800/g, 'bg-[#F9F8F6] border-2 border-stone-900 p-6');
content = content.replace(/bg-white rounded-none border border-stone-200/g, 'bg-[#F9F8F6] border-2 border-stone-900');
content = content.replace(/bg-white/g, 'bg-[#F9F8F6]');

// The hero banner should look more like a newspaper header 
// Currently it's bg-gradient-to-br from-stone-900 to-stone-950
content = content.replace(/bg-gradient-to-br from-stone-900 to-stone-950 p-6 sm:p-8 rounded-none border border-stone-800 shadow-xl relative overflow-hidden/g, 'bg-stone-900 p-6 sm:p-8 border-b-4 border-stone-950 relative overflow-hidden');

fs.writeFileSync('src/components/Dashboard.tsx', content);

console.log("Done Dashboard styling");
