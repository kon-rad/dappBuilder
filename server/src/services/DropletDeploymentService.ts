import { Client } from 'ssh2';

interface DeploymentConfig {
  appName: string;
  dropletIp: string;
  sshUsername: string;
  sshPrivateKey: string;
  domain: string;
}

export class DropletDeploymentService {
  private config: DeploymentConfig;
  private sshClient: Client;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.sshClient = new Client();
  }

  private async connectSSH(): Promise<void> {
    
    return new Promise((resolve, reject) => {
      this.sshClient
        .on('ready', resolve)
        .on('error', reject)
        .connect({
          host: this.config.dropletIp,
          username: this.config.sshUsername,
          privateKey: this.config.sshPrivateKey,
        });
    });
  }

  private async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sshClient.exec(command, (err, stream) => {
        if (err) reject(err);
        
        let output = '';
        stream
          .on('data', (data: any) => { output += data; })
          .on('close', () => { resolve(output); })
          .on('error', reject);
      });
    });
  }

  async deploy(): Promise<{ url: string }> {
    try {
      console.log('Starting deployment process...');
      await this.connectSSH();
      console.log('SSH connection established');

      // Create app directory
      console.log(`Creating app directory: /var/www/${this.config.appName}`);
      await this.executeCommand(`mkdir -p /var/www/${this.config.appName}`);
      
      // Create Next.js app
      console.log('Creating Next.js application...');
      const createAppCommand = [
        `cd /var/www/${this.config.appName}`,
        'npx create-next-app@latest . --typescript --tailwind --eslint=false --app --src-dir --import-alias="@/*" --use-npm'
      ].join(' && ');
      
      await this.executeCommand(createAppCommand);
      console.log('Next.js app created successfully');

      // Setup PM2 configuration
      console.log('Setting up PM2 configuration...');
      const pm2Config = `
module.exports = {
  apps: [{
    name: '${this.config.appName}',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/${this.config.appName}',
    env: {
      PORT: '3000',
      NODE_ENV: 'production'
    }
  }]
}`;
      
      await this.executeCommand(`echo '${pm2Config}' > /var/www/${this.config.appName}/ecosystem.config.js`);
      console.log('PM2 configuration created');
      
      // Build and start the app
      console.log('Starting build process...');
      const deployCommands = [
        `cd /var/www/${this.config.appName}`,
        'npm install',
        'npm run build',
        'pm2 start ecosystem.config.js'
      ].join(' && ');
      
      await this.executeCommand(deployCommands);
      console.log('App built and started with PM2 successfully');

      // Setup Nginx configuration
      console.log('Configuring Nginx...');
      const nginxConfig = `
server {
    listen 80;
    server_name ${this.config.appName}.${this.config.domain};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

      await this.executeCommand(`echo '${nginxConfig}' | sudo tee /etc/nginx/sites-available/${this.config.appName}`);
      await this.executeCommand(`sudo ln -sf /etc/nginx/sites-available/${this.config.appName} /etc/nginx/sites-enabled/`);
      await this.executeCommand('sudo nginx -t && sudo systemctl reload nginx');
      
      console.log('Nginx configured successfully');

      // Cleanup
      console.log('Cleaning up connections...');
      this.sshClient.end();
      
      console.log('Deployment completed successfully!');
      return {
        url: `http://${this.config.appName}.${this.config.domain}`
      };

    } catch (error) {
      console.error('Deployment failed:', error);
      this.sshClient.end();
      throw error;
    }
  }
} 