const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5001;

const LOG_FILE = path.join(__dirname, 'plugin.log');

// Custom logger to write to both console and file with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  console.log(formattedMessage);
  fs.appendFileSync(LOG_FILE, formattedMessage + '\n');
}

app.use(express.json());

// 1. GET /info - Expose dynamic configuration options for this plugin
app.get('/info', (req, res) => {
  log('[Mock Proxmox] GET /info received');
  res.json({
    id: 'proxmox-ve-driver',
    name: 'Proxmox VE Driver',
    version: '1.0.0',
    description: 'Automated provisioning driver for Proxmox VE hypervisor clusters.',
    configSchema: {
      type: 'object',
      required: ['hostUrl', 'username', 'password', 'nodeName', 'storagePool'],
      properties: {
        hostUrl: { type: 'string', title: 'Proxmox API URL', default: 'https://10.0.1.10:8006/api2/json' },
        username: { type: 'string', title: 'API Username', default: 'root@pam' },
        password: { type: 'string', title: 'API Password' },
        nodeName: { type: 'string', title: 'Target Node Name', default: 'pve-node-01' },
        storagePool: { type: 'string', title: 'Target Storage Pool', default: 'local-lvm' },
        vlanId: { type: 'number', title: 'VLAN Tag ID (Optional)' }
      }
    }
  });
});

// 2. POST /provision - Execute simulated VM provisioning on Proxmox VE
app.post('/provision', async (req, res) => {
  const { requestId, ticketId, hostname, specs, config } = req.body;
  
  log(`\n======================================================`);
  log(`🚀 [Mock Proxmox] PROVISIONING START for request: ${requestId}`);
  log(`   - Ticket ID:  ${ticketId}`);
  log(`   - Hostname:   ${hostname}`);
  log(`   - Specs:      ${specs.cpu} CPU, ${specs.ram}GB RAM, ${specs.disk}GB Disk`);
  log(`   - Config (Decrypted from Vault):`);
  log(`     • Host URL:    ${config?.hostUrl}`);
  log(`     • Username:    ${config?.username}`);
  log(`     • Password:    [DECRYPTED - Length: ${config?.password ? config.password.length : 0} chars]`);
  log(`     • Target Node: ${config?.nodeName}`);
  log(`     • Storage:     ${config?.storagePool}`);
  log(`======================================================\n`);

  // Simulate 3 seconds hypervisor operation latency
  setTimeout(() => {
    const assignedIp = `10.0.10.88`;
    const sshPassword = Math.random().toString(36).slice(-8); // Generate secure random temp pass

    log(`✅ [Mock Proxmox] VM Provisioned successfully on node ${config?.nodeName}!`);
    log(`   - Assigned IP:  ${assignedIp}`);
    log(`   - Temp SSH Pass: ${sshPassword}\n`);

    res.status(200).json({
      success: true,
      ipAddress: assignedIp,
      sshUser: 'yato',
      sshPassword: sshPassword,
      sshPort: 22,
      message: `VM ${hostname} provisioned successfully on Proxmox node ${config?.nodeName}.`
    });
  }, 3000);
});

app.listen(PORT, () => {
  log(`⚡ [Mock Proxmox Plugin] Listening on port ${PORT}`);
  log(`📄 Logging to file: ${LOG_FILE}`);
});
