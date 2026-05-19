const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// 1. GET /info - Expose dynamic configuration options for this plugin
app.get('/info', (req, res) => {
  console.log('[Mock Proxmox] GET /info received');
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
  
  console.log(`\n======================================================`);
  console.log(`🚀 [Mock Proxmox] PROVISIONING START for request: ${requestId}`);
  console.log(`   - Ticket ID:  ${ticketId}`);
  console.log(`   - Hostname:   ${hostname}`);
  console.log(`   - Specs:      ${specs.cpu} CPU, ${specs.ram}GB RAM, ${specs.disk}GB Disk`);
  console.log(`   - Config (Decrypted from Vault):`);
  console.log(`     • Host URL:    ${config.hostUrl}`);
  console.log(`     • Username:    ${config.username}`);
  console.log(`     • Password:    [DECRYPTED - Length: ${config.password ? config.password.length : 0} chars]`);
  console.log(`     • Target Node: ${config.nodeName}`);
  console.log(`     • Storage:     ${config.storagePool}`);
  console.log(`======================================================\n`);

  // Simulate 3 seconds hypervisor operation latency
  setTimeout(() => {
    const assignedIp = `10.0.10.88`;
    const sshPassword = Math.random().toString(36).slice(-8); // Generate secure random temp pass

    console.log(`✅ [Mock Proxmox] VM Provisioned successfully on node ${config.nodeName}!`);
    console.log(`   - Assigned IP:  ${assignedIp}`);
    console.log(`   - Temp SSH Pass: ${sshPassword}\n`);

    res.status(200).json({
      success: true,
      ipAddress: assignedIp,
      sshUser: 'yato',
      sshPassword: sshPassword,
      sshPort: 22,
      message: `VM ${hostname} provisioned successfully on Proxmox node ${config.nodeName}.`
    });
  }, 3000);
});

app.listen(PORT, () => {
  console.log(`⚡ [Mock Proxmox Plugin] Listening on port ${PORT}`);
});
