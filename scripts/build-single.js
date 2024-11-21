const fs = require('fs');
const path = require('path');

// Ensure dist-tsc directory exists
const distDir = path.join(__dirname, '..', 'dist-tsc');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy manifest.single.json as manifest.json
fs.copyFileSync(
    path.join(__dirname, '..', 'src', 'manifest.single.json'),
    path.join(distDir, 'manifest.json')
);

// Copy popup.html
fs.copyFileSync(
    path.join(__dirname, '..', 'src', 'popup.html'),
    path.join(distDir, 'popup.html')
);

// Remove unnecessary files
const filesToRemove = ['bundle.d.ts', 'bundle.js.map'];
filesToRemove.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
});
