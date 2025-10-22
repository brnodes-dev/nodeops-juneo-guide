// app.js - front-end logic (Revised for Juneo Process Control and File Restore)
document.addEventListener('DOMContentLoaded', () => {
  // Alteramos o seletor para incluir todos os botões de busca de dados
  const getDataBtns = document.querySelectorAll('.get-node-data-btn');
  
  // O output principal do Node ID (mantivei o nome original para evitar mudar o CSS, mas ele será redefinido pelo fetchNodeData)
  const nodeOut = document.getElementById('nodeIDOutput'); 
  
  // Control Buttons and Output
  const startNodeBtn = document.getElementById('startNode');
  const stopNodeBtn = document.getElementById('stopNode');
  const statusOut = document.getElementById('processStatusOutput');
  
  // Restore Elements
  const restoreForm = document.getElementById('restoreForm');
  const restoreMessage = document.getElementById('restoreMessage');


  // Function to fetch status from /health endpoint (Mantida)
  const updateStatus = async () => {
      try {
          const r = await fetch('/health');
          const j = await r.json();
          statusOut.classList.remove('status-online', 'status-offline', 'muted');
          
          if (j.juneoProcessRunning) {
              statusOut.textContent = 'NODE RUNNING (Process Active)';
              statusOut.classList.add('status-online');
          } else {
              statusOut.textContent = 'NODE OFFLINE (Process Stopped)';
              statusOut.classList.add('status-offline');
          }
      } catch (e) {
          statusOut.textContent = 'WEB SERVER OFFLINE';
          statusOut.classList.add('status-offline');
      }
  };

  // Function to handle POST requests for control (Mantida)
  const sendControlCommand = async (endpoint, actionName) => {
      statusOut.textContent = `${actionName}...`;
      statusOut.classList.remove('status-online', 'status-offline');
      statusOut.classList.add('muted');
      
      try {
          const res = await fetch(`/api/${endpoint}`, { method: 'POST' });
          const data = await res.json();
          alert(`Command successful: ${data.message}`);
          
          // Wait a moment for the process to stabilize then update status
          setTimeout(updateStatus, 3500); 
      } catch (e) {
          alert(`Failed to execute ${actionName}: ${e.message}`);
          updateStatus(); // Update status in case of failure
      }
  };
  
  // Function to retrieve all node data (Node ID, BLS Key, POP) from RPC
  const fetchNodeData = async (outputId, fieldName) => {
    const outputElement = document.getElementById(outputId);
    if (!outputElement) return;

    outputElement.textContent = `Fetching ${fieldName}...`;
    try {
      // Todos os dados vêm da mesma chamada RPC
      const res = await fetch('/api/nodeid'); 
      if (!res.ok) {
        outputElement.textContent = `Error: Node RPC is unavailable.`;
        return;
      }
      const data = await res.json();
      
      if (data && data.result) {
        if (fieldName === 'nodeID' && data.result.nodeID) {
          outputElement.textContent = data.result.nodeID;
        } else if (fieldName === 'publicKey' && data.result.nodePOP && data.result.nodePOP.publicKey) {
          outputElement.textContent = data.result.nodePOP.publicKey;
        } else if (fieldName === 'proofOfPossession' && data.result.nodePOP && data.result.nodePOP.proofOfPossession) {
          outputElement.textContent = data.result.nodePOP.proofOfPossession;
        } else {
          outputElement.textContent = `Data field not found. Full response: ${JSON.stringify(data.result)}`;
        }
      } else {
        outputElement.textContent = `Error: Invalid RPC response structure.`;
      }
    } catch (err) {
      outputElement.textContent = 'Network Error: Check node status.';
    }
  };


  // 1. Initial Status Load and Periodic Check (Mantida)
  updateStatus();
  setInterval(updateStatus, 30000); 

  // 2. Control Button Listeners (Mantida)
  startNodeBtn?.addEventListener('click', () => sendControlCommand('start', 'Starting Node'));
  stopNodeBtn?.addEventListener('click', () => sendControlCommand('stop', 'Stopping Node'));
  
  // 3. Node Data Fetch Logic (BLS, Node ID, POP)
  getDataBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Extrai o tipo de dado e o ID do elemento de output do atributo data-field
        const fieldName = btn.getAttribute('data-field'); 
        // O outputId é o fieldName + 'Output' (e.g., 'nodeID' + 'Output' = 'nodeIDOutput')
        const outputId = fieldName + 'Output'; 
        
        fetchNodeData(outputId, fieldName);
      });
  });

  // 4. Download warning (Mantida)
  document.querySelectorAll('a[href^="/download"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      setTimeout(() => {
        alert('SUCCESS! Make sure you saved the file in a safe place (offline) after download.');
      }, 300);
    });
  });
  
  // 5. Node Restoration Logic (Mantida)
  restoreForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Safety confirmation: node must be stopped
    const healthResponse = await fetch('/health');
    const healthJson = await healthResponse.json();
    if (healthJson.juneoProcessRunning) {
         restoreMessage.textContent = 'ERROR: Node must be STOPPED before restoration. Click "Stop Node" first.';
         restoreMessage.classList.add('status-offline');
         return;
    }

    restoreMessage.textContent = 'Uploading files and restoring node...';
    restoreMessage.classList.remove('status-offline', 'status-online');
    restoreMessage.classList.add('muted');
    
    try {
        const formData = new FormData(restoreForm);
        
        const res = await fetch('/api/restore', {
            method: 'POST',
            body: formData 
        });

        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            restoreMessage.textContent = `SUCCESS: ${data.message} Wait 15s then click 'Fetch Node ID' to verify.`;
            restoreMessage.classList.add('status-online');
            // Update status after restart
            setTimeout(updateStatus, 5000); 
        } else {
             restoreMessage.textContent = `ERROR: ${data.message}`;
             restoreMessage.classList.add('status-offline');
             setTimeout(updateStatus, 500);
        }
    } catch (err) {
        restoreMessage.textContent = `FATAL ERROR: Failed to reach server during upload.`;
        restoreMessage.classList.add('status-offline');
    }
  });

});