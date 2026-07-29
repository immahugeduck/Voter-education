const fs = require('fs');

let content = fs.readFileSync('src/components/StateBriefing.tsx', 'utf8');

content = content.replace(/bg-white/g, 'bg-[#F9F8F6]');

fs.writeFileSync('src/components/StateBriefing.tsx', content);

console.log("Done StateBriefing styling");
