const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace double quote strings
    content = content.replace(/"http:\/\/localhost:2026([^"]*)"/g, '`${import.meta.env.VITE_API_BASE_URL}$1`');
    // Replace template strings
    content = content.replace(/`http:\/\/localhost:2026([^`]*)`/g, '`${import.meta.env.VITE_API_BASE_URL}$1`');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            replaceInFile(fullPath);
        }
    });
}

traverseDir(srcDir);
