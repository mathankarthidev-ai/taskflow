const fs = require('fs');
const path = require('path');

// Resolve junction to true canonical physical root on F: drive
const realRoot = fs.realpathSync(process.cwd());
process.chdir(realRoot);
process.env.PWD = realRoot;

// Run Next.js CLI
require('./node_modules/next/dist/bin/next');
