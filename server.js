// server.js
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const multer = require('multer'); // NEW!

const app = express();
app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PUBLIC_DIR = path.join(__dirname, 'public');

// Config from env
const JUNEO_BIN = process.env.JUNEO_BIN_PATH || '/home/juneogo/juneogo'; 
const JUNEO_HOME = process.env.JUNEO_HOME || '/home/juneogo';
const PORT = parseInt(process.env.APP_PORT || process.env.PORT || '8080', 10);

// --- Multer Configuration for File Upload ---
const STAKING_DIR = path.join(JUNEO_HOME, '.juneogo', 'staking');
const RESTORE_FILES = ['signer.key', 'staker.crt', 'staker.key'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensures file goes to the staking directory
    cb(null, STAKING_DIR);
  },
  filename: (req, file, cb) => {
    // Ensures only allowed file names are saved, using the field name as the filename
    if (RESTORE_FILES.includes(file.fieldname)) {
        cb(null, file.fieldname); 
    } else {
        cb(new Error('File name not allowed for staking restore'), false);
    }
  }
});

// Multer middleware configured to expect 3 specific files
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 } // 1MB limit per file
}).fields([
    { name: 'signer.key', maxCount: 1 },
    { name: 'staker.crt', maxCount: 1 },
    { name: 'staker.key', maxCount: 1 }
]);
// --- END MULTER CONFIGURATION ---

// allowed files to download (exact names)
const ALLOWED_FILES = {
  'signer.key': path.join(JUNEO_HOME, '.juneogo', 'staking', 'signer.key'),
  'staker.crt': path.join(JUNEO_HOME, '.juneogo', 'staking', 'staker.crt'),
  'staker.key': path.join(JUNEO_HOME, '.juneogo', 'staking', 'staker.key')
};

// GLOBAL: Reference to the spawned Juneo process
let juneoProcess = null;

// Function to start the Juneo node
function startJuneo() {
  if (juneoProcess) {
    console.warn('[WARN] Juneo process is already running.');
    return;
  }
  if (!fs.existsSync(JUNEO_BIN)) {
    console.warn(`[WARN] juneo binary not found at ${JUNEO_BIN}. Skipping automatic start.`);
    return;
  }

  try {
    console.log(`[INFO] Spawning juneo from ${JUNEO_BIN} (HOME=${JUNEO_HOME})`);
    juneoProcess = spawn(JUNEO_BIN, [], {
      env: Object.assign({}, process.env, { HOME: JUNEO_HOME }),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    juneoProcess.stdout.on('data', (d) => {
      process.stdout.write(`[juneo stdout] ${d.toString()}`);
    });
    juneoProcess.stderr.on('data', (d) => {
      process.stderr.write(`[juneo stderr] ${d.toString()}`);
    });

    juneoProcess.on('exit', (code, signal) => {
      console.warn(`[WARN] juneo process exited with code=${code} signal=${signal}`);
      // Clear the reference when it exits
      juneoProcess = null; 
    });
  } catch (err) {
    console.error('[ERROR] failed to start juneo:', err);
    juneoProcess = null;
  }
}

// Function to stop the Juneo node
function stopJuneo() {
    if (juneoProcess) {
        // Send SIGTERM signal to gently stop the process
        juneoProcess.kill('SIGTERM'); 
        console.log('[INFO] Sent SIGTERM to juneo process.');
        return true;
    }
    console.warn('[WARN] Juneo process is not running.');
    return false;
}

// Start juneo process right away (best-effort)
startJuneo();

// Serve static UI
app.use('/', express.static(PUBLIC_DIR));

// Endpoint to start the Juneo process
app.post('/api/start', (req, res) => {
    if (juneoProcess) {
        return res.status(200).json({ status: 'running', message: 'Juneo node is already running.' });
    }
    startJuneo();
    // Give time for the process to start
    setTimeout(() => {
        res.status(200).json({ status: 'started', message: 'Juneo node started.' });
    }, 500); 
});

// Endpoint to stop the Juneo process
app.post('/api/stop', (req, res) => {
    if (stopJuneo()) {
        res.status(200).json({ status: 'stopped', message: 'Juneo node stopped.' });
    } else {
        res.status(200).json({ status: 'offline', message: 'Juneo node was already stopped.' });
    }
});

// Endpoint to restart the Juneo process
app.post('/api/restart', (req, res) => {
    if (juneoProcess) {
        stopJuneo();
        // Wait for process to fully exit before starting new one
        setTimeout(() => {
            startJuneo();
            res.status(200).json({ status: 'restarted', message: 'Juneo node restarted.' });
        }, 3000); // 3 seconds wait for graceful exit
    } else {
        startJuneo();
        setTimeout(() => {
            res.status(200).json({ status: 'started', message: 'Juneo node was started.' });
        }, 500); 
    }
});

// Endpoint to update binaries and restart
app.post('/api/update', (req, res) => {
    // 1. Must be stopped first
    if (juneoProcess) {
        return res.status(409).json({ status: 'conflict', message: 'Stop the Juneo node first before updating binaries.' });
    }

    // 2. Define paths
    const BIN_REPO_PATH = '/tmp/juneogo-binaries';
    const JUNEOGO_HOME_PLUGINS = path.join(JUNEO_HOME, '.juneogo', 'plugins');

    // Command shell to update repo, move, and apply permissions
    const updateCommand = `
        cd ${BIN_REPO_PATH} && git pull origin main && 
        chmod +x ${BIN_REPO_PATH}/juneogo &&
        chmod +x ${BIN_REPO_PATH}/plugins/jevm &&
        chmod +x ${BIN_REPO_PATH}/plugins/srEr2XGGtowDVNQ6YgXcdUb16FGknssLTGUFYg7iMqESJ4h8e &&
        
        # Replace binaries in final location
        cp -f ${BIN_REPO_PATH}/juneogo ${JUNEO_HOME}/juneogo && 
        cp -f ${BIN_REPO_PATH}/plugins/jevm ${JUNEOGO_HOME_PLUGINS}/jevm &&
        cp -f ${BIN_REPO_PATH}/plugins/srEr2XGGtowDVNQ6YgXcdUb16FGknssLTGUFYg7iMqESJ4h8e ${JUNEOGO_HOME_PLUGINS}/srEr2XGGtowDVNQ6YgXcdUb16FGknssLTGUFYg7iMqESJ4h8e
    `;

    exec(updateCommand, { env: { HOME: JUNEO_HOME } }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[ERROR] Update failed: ${error.message}`);
            return res.status(500).json({ status: 'error', message: `Update failed. Check logs: ${stderr || stdout}` });
        }
        
        console.log(`[INFO] Update succeeded: ${stdout}`);
        // 3. Restart the node after update
        startJuneo(); 

        res.status(200).json({ status: 'updated', message: 'Binaries updated and Juneo node restarted. Check logs for bootstrap status.' });
    });
});

// --- NEW ENDPOINT: FILE RESTORATION ---
app.post('/api/restore', (req, res) => {
    // 1. Node MUST be stopped before restoring, to prevent corruption
    if (juneoProcess) {
        return res.status(409).json({ status: 'conflict', message: 'Stop the Juneo node process before attempting file restoration.' });
    }

    upload(req, res, function (err) {
        let uploadedCount = 0;
        
        if (req.files) {
             uploadedCount = Object.keys(req.files).length;
        }

        if (err instanceof multer.MulterError) {
            console.error('[ERROR] Multer error during restore:', err);
            return res.status(400).json({ status: 'error', message: `Upload failed: ${err.message}` });
        } else if (err) {
            console.error('[ERROR] Generic error during restore:', err);
            return res.status(500).json({ status: 'error', message: `Restore failed: ${err.message}` });
        }

        if (uploadedCount > 0) {
            // 2. Files uploaded successfully. Restart Node
            startJuneo(); 
            return res.status(200).json({ 
                status: 'success', 
                message: `Successfully restored ${uploadedCount} file(s). Node is restarting with original ID.` 
            });
        } else {
            // User submitted form but no files were attached/found
            return res.status(400).json({ 
                status: 'warning', 
                message: `No files were uploaded. Restore operation aborted.` 
            });
        }
    });
});
// --- END NEW ENDPOINT ---

// Endpoint to download staking files
app.get('/download/:name', (req, res) => {
    const name = req.params.name;
    if (!Object.prototype.hasOwnProperty.call(ALLOWED_FILES, name)) {
        return res.status(404).json({ error: 'File not allowed' });
    }
    const full = ALLOWED_FILES[name];
    if (!fs.existsSync(full)) {
        return res.status(404).json({ error: 'File not found' });
    }
    res.download(full, name, (err) => {
        if (err) {
            console.error('Error sending file', err);
            if (!res.headersSent) res.status(500).json({ error: 'Failed to send file' });
        }
    });
});

// Endpoint to obtain Node ID via RPC
app.get('/api/nodeid', async (req, res) => {
    try {
        const rpcUrl = 'http://127.0.0.1:9650/ext/info';
        const payload = {
            jsonrpc: '2.0',
            id: 1,
            method: 'info.getNodeID'
        };
        const response = await axios.post(rpcUrl, payload, { timeout: 5000, headers: { 'content-type': 'application/json' } });
        return res.json(response.data);
    } catch (err) {
        console.error('Error fetching node id', err && err.toString());
        const isOffline = err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT';
        const status = isOffline ? 'Juneo node process seems offline or RPC port is inaccessible.' : 'Failed to fetch node id. Check node logs.';
        return res.status(500).json({ error: status });
    }
});

// Health endpoint
app.get('/health', (req, res) => {
    const exists = fs.existsSync(ALLOWED_FILES['signer.key']) || fs.existsSync(ALLOWED_FILES['staker.key']) || fs.existsSync(ALLOWED_FILES['staker.crt']);
    res.json({
        status: 'ok',
        juneoBinary: fs.existsSync(JUNEO_BIN),
        stakingFilesPresent: exists,
        juneoProcessRunning: !!juneoProcess
    });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Public UI: http://0.0.0.0:${PORT}/`);
});