const { spawn } = require('child_process');
const path = require('path');

function startServer() {
    const server = spawn('node', [path.join(__dirname, '.next/standalone/server.js')], {
        env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0' },
        stdio: 'inherit'
    });
    
    server.on('exit', (code) => {
        console.log(`Server exited with code ${code}, restarting in 2s...`);
        setTimeout(startServer, 2000);
    });
    
    server.on('error', (err) => {
        console.error(`Server error: ${err.message}, restarting in 2s...`);
        setTimeout(startServer, 2000);
    });
}

startServer();
