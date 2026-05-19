const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'frontend/src/app');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir(targetDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace various specific inline header classes with standard page-title
    content = content.replace(/<h1 className="text-\[28px\] font-bold text-slate-900 tracking-tight">/g, '<h1 className="page-title">');
    content = content.replace(/<h1 className="text-2xl font-bold text-slate-900 tracking-tight">/g, '<h1 className="page-title">');
    content = content.replace(/<h1 className="text-3xl font-bold text-slate-900 tracking-tight">/g, '<h1 className="page-title">');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
console.log('Done!');
