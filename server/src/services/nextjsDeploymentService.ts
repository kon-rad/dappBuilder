import * as digitalocean from 'digitalocean';
import { NodeSSH } from 'node-ssh';
import dotenv from 'dotenv';

dotenv.config();

interface DeploymentConfig {
  appName: string;
  dropletId: number;
}

interface DeploymentResult {
  url: string;
}

export class NextjsDeploymentService {
  private client: digitalocean.Client;
  private config: DeploymentConfig;
  private ssh: NodeSSH;

  constructor(config: DeploymentConfig) {
    if (!process.env.DIGITAL_OCEAN_TOKEN) {
      throw new Error('DIGITAL_OCEAN_TOKEN is required');
    }
    this.client = digitalocean.client(process.env.DIGITAL_OCEAN_TOKEN);
    this.ssh = new NodeSSH();
    this.config = config;
  }

  async deploy(): Promise<DeploymentResult> {
    try {
      // Get droplet info
      const droplet = await this.client.droplets.get(this.config.dropletId);
      const ipAddress = droplet.networks.v4.find(n => n.type === 'public')?.ip_address;
      
      if (!ipAddress) {
        throw new Error('No public IP address found for droplet');
      }

      // Connect via SSH
      await this.ssh.connect({
        host: ipAddress,
        username: 'root',
        privateKey: process.env.SSH_PRIVATE_KEY
      });

      // Install dependencies and setup environment
      await this.ssh.execCommand('apt-get update && apt-get install -y nodejs npm nginx');
      
      // Create and configure Next.js app
      const commands = [
        `mkdir -p /var/www`,
        `cd /var/www`,
        `npx create-next-app@latest ${this.config.appName} --typescript --tailwind=false --eslint=false --app=false --src-dir=false --import-alias="@/*" --use-npm`,
        `cd ${this.config.appName}`,
        `npm install`,
        `npm run build`,
        // Install and setup PM2
        `npm install -g pm2`,
        `pm2 start npm --name "${this.config.appName}" -- start`,
      ];

      for (const command of commands) {
        const result = await this.ssh.execCommand(command);
        if (result.stderr) {
          console.error(`Error executing command ${command}:`, result.stderr);
        }
      }

      // Configure Nginx
      const nginxConfig = `
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

      await this.ssh.execCommand(`echo '${nginxConfig}' > /etc/nginx/sites-available/default`);
      await this.ssh.execCommand('systemctl restart nginx');

      // Close SSH connection
      await this.ssh.dispose();

      return {
        url: `http://${ipAddress}`
      };

    } catch (error) {
      console.error('Deployment failed:', error);
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.account.get();
      return true;
    } catch (error) {
      console.error('Failed to connect to DigitalOcean:', error);
      return false;
    }
  }

  async getDropletInfo(): Promise<any> {
    try {
      return await this.client.droplets.get(this.config.dropletId);
    } catch (error) {
      console.error('Failed to get droplet info:', error);
      throw error;
    }
  }
}