const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content
        .replace(/#6366f1/g, '#ff0033')
        .replace(/#4338ca/g, '#bf001f')
        .replace(/#64748b/g, '#a1a1aa')
        .replace(/#6366f133/g, '#ff003333');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

replaceInDir('/Users/techmines/Desktop/Coding/devpulse/frontend/src');
