const fs = require('fs');
const path = require('path');

const mode = process.argv[2]; // 'enable' or 'disable'

const SERVER_ONLY_DIRS = [
  { src: 'src/server-only/api', dest: 'src/app/api' },
  { src: 'src/server-only/admin', dest: 'src/app/admin' }
];

if (mode === 'enable') {
  SERVER_ONLY_DIRS.forEach(({ src, dest }) => {
    const srcPath = path.join(__dirname, '..', src);
    const destPath = path.join(__dirname, '..', dest);
    
    if (fs.existsSync(srcPath)) {
      if (!fs.existsSync(path.dirname(destPath))) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
      }
      copyFolderSync(srcPath, destPath);
      console.log(`ENABLE: Moved ${src} to ${dest}`);
    }
  });
} else if (mode === 'disable') {
  SERVER_ONLY_DIRS.forEach(({ dest }) => {
    const destPath = path.join(__dirname, '..', dest);
    if (fs.existsSync(destPath)) {
      deleteFolderRecursive(destPath);
      console.log(`DISABLE: Removed ${dest}`);
    }
  });
}

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  const elements = fs.readdirSync(from);
  elements.forEach(element => {
    const curFrom = path.join(from, element);
    const curTo = path.join(to, element);
    if (fs.lstatSync(curFrom).isDirectory()) {
      copyFolderSync(curFrom, curTo);
    } else {
      fs.copyFileSync(curFrom, curTo);
    }
  });
}

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}
