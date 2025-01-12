import { Client } from 'ssh2';

interface SSHConfig {
  dropletIp: string;
  sshUsername: string;
  sshPrivateKey: string;
}

export class HelloWorldService {
  private config: SSHConfig;
  private sshClient: Client;

  constructor(config: SSHConfig) {
    this.config = config;
    this.sshClient = new Client();
  }

  private async connectSSH(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Format the private key by ensuring it has proper line breaks
      const formattedKey = this.config.sshPrivateKey
        .replace(/\\n/g, '\n')
        .replace(/^"|"$/g, '');

      console.log('Attempting SSH connection with:', {
        host: this.config.dropletIp,
        username: this.config.sshUsername,
        hasPrivateKey: !!formattedKey,
        keyFirstLine: formattedKey.split('\n')[0] // Log first line to verify format
      });

      this.sshClient
        .on('ready', () => {
          console.log('SSH Connection established successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('SSH Connection error:', err);
          reject(err);
        })
        .connect({
          host: this.config.dropletIp,
          username: this.config.sshUsername,
          privateKey: formattedKey,
          debug: (message: string) => console.log('SSH Debug:', message),
          readyTimeout: 30000,
        });
    });
  }

  private async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sshClient.exec(command, (err, stream) => {
        if (err) reject(err);
        
        let output = '';
        let errorOutput = '';
        
        stream
          .on('data', (data: Buffer) => { output += data.toString(); })
          .stderr.on('data', (data: Buffer) => { errorOutput += data.toString(); })
          .on('close', () => { resolve(output || errorOutput); })
          .on('error', reject);
      });
    });
  }

  async createAndRunHelloWorld(): Promise<string> {
    try {
      console.log('Starting SSH connection...');
      await this.connectSSH();
      console.log('SSH connection established');

      // Create hello world script
      const helloWorldScript = `
console.log('Hello from Digital Ocean!');
console.log('Current time:', new Date().toISOString());
console.log('Server info:', process.version);
      `.trim();

      // Create and run the script
      const commands = [
        'mkdir -p ~/hello-world',
        `echo '${helloWorldScript}' > ~/hello-world/hello.js`,
        'node ~/hello-world/hello.js'
      ];

      let output = '';
      for (const command of commands) {
        console.log(`Executing: ${command}`);
        output += await this.executeCommand(command) + '\n';
      }

      this.sshClient.end();
      return output;

    } catch (error) {
      console.error('Hello World deployment failed:', error);
      this.sshClient.end();
      throw error;
    }
  }
} 