const fs = require('fs');
const files = [
  'src/components/RollCallVotesView.tsx',
  'src/components/PlainLanguageDirectory.tsx',
  'src/components/CitizensConsensus.tsx',
  'src/components/UpcomingVoteAlerts.tsx',
  'src/components/StandaloneChat.tsx',
  'src/components/VoterInformation.tsx',
  'src/components/BillDetailModal.tsx',
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/bg-white/g, 'bg-[#F9F8F6]');
    fs.writeFileSync(file, content);
  }
});

console.log("Done other components styling");
