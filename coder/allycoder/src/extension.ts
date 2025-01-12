// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class WelcomePanelProvider {
	public static currentPanel: WelcomePanelProvider | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	private constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;
		this._panel.webview.html = this._getWebviewContent();
		this._setWebviewMessageListener(this._panel.webview);
	}

	public static render(context: vscode.ExtensionContext) {
		if (WelcomePanelProvider.currentPanel) {
			WelcomePanelProvider.currentPanel._panel.reveal(vscode.ViewColumn.One);
		} else {
			const panel = vscode.window.createWebviewPanel(
				'allyCoder',
				'Ally Coder',
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			);

			WelcomePanelProvider.currentPanel = new WelcomePanelProvider(panel);
		}
	}

	private _getWebviewContent() {
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body {
						padding: 20px;
						font-family: -apple-system, BlinkMacSystemFont, sans-serif;
						color: var(--vscode-foreground);
					}
					.container {
						max-width: 600px;
						margin: 0 auto;
						text-align: center;
					}
					h1 {
						font-size: 2.5em;
						margin-bottom: 10px;
						color: var(--vscode-editor-foreground);
					}
					h2 {
						font-size: 1.5em;
						margin-bottom: 30px;
						color: var(--vscode-descriptionForeground);
					}
					.input-group {
						margin-bottom: 20px;
						text-align: left;
					}
					label {
						display: block;
						margin-bottom: 5px;
						color: var(--vscode-input-foreground);
					}
					input, textarea {
						width: 100%;
						padding: 8px;
						margin-bottom: 10px;
						background: var(--vscode-input-background);
						color: var(--vscode-input-foreground);
						border: 1px solid var(--vscode-input-border);
						border-radius: 4px;
					}
					textarea {
						min-height: 100px;
						resize: vertical;
					}
					button {
						padding: 10px 20px;
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						border-radius: 4px;
						cursor: pointer;
						font-size: 1.1em;
					}
					button:hover {
						background: var(--vscode-button-hoverBackground);
					}

					/* New Tab Styles */
					.tabs {
						display: flex;
						margin-bottom: 20px;
						border-bottom: 1px solid var(--vscode-input-border);
					}
					.tab {
						padding: 10px 20px;
						cursor: pointer;
						border: none;
						background: none;
						color: var(--vscode-foreground);
						font-size: 1.1em;
					}
					.tab.active {
						border-bottom: 2px solid var(--vscode-button-background);
						color: var(--vscode-button-background);
					}
					.tab-content {
						display: none;
					}
					.tab-content.active {
						display: block;
					}

					/* Chat Styles */
					.chat-container {
						height: 400px;
						display: flex;
						flex-direction: column;
					}
					.chat-messages {
						flex-grow: 1;
						overflow-y: auto;
						margin-bottom: 20px;
						padding: 10px;
						background: var(--vscode-input-background);
						border: 1px solid var(--vscode-input-border);
						border-radius: 4px;
					}
					.message {
						margin: 10px 0;
						padding: 8px 12px;
						border-radius: 4px;
						max-width: 80%;
					}
					.user-message {
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						margin-left: auto;
					}
					.assistant-message {
						background: var(--vscode-editor-background);
						border: 1px solid var(--vscode-input-border);
						margin-right: auto;
					}
					.chat-input-container {
						display: flex;
						gap: 10px;
					}
					#chatInput {
						flex-grow: 1;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<h1>Welcome to Arete</h1>
					
					<div class="tabs">
						<button class="tab active" data-tab="home">Home</button>
						<button class="tab" data-tab="chat">Chat</button>
						<button class="tab" data-tab="knowledge">Knowledge Base</button>
						<button class="tab" data-tab="overview">Overview</button>
					</div>

					<div id="home" class="tab-content active">
						<h2>The best AI coding companion</h2>
						<div class="input-group">
							<label for="appDescription">Describe your app:</label>
							<textarea id="appDescription" placeholder="Enter a detailed description of your app..."></textarea>
						</div>
						
						<div class="input-group">
							<label for="repoStarter">Github repo starter:</label>
							<input type="text" id="repoStarter" placeholder="e.g., username/repo">
						</div>
						
						<button id="startButton">Start</button>
					</div>

					<div id="chat" class="tab-content">
						<h2>Chat with Arete</h2>
						<div class="chat-container">
							<div class="chat-messages" id="chatMessages">
								<div class="message assistant-message">
									Hello! I'm Arete, your AI coding companion. How can I help you today?
								</div>
							</div>
							<div class="chat-input-container">
								<input type="text" id="chatInput" placeholder="Type your message...">
								<button id="sendMessage">Send</button>
							</div>
						</div>
					</div>

					<div id="knowledge" class="tab-content">
						<h2>Knowledge Base</h2>
						<p>Coming soon: Access documentation and coding best practices!</p>
					</div>

					<div id="overview" class="tab-content">
						<h2>Project Overview</h2>
						<p>Coming soon: Get insights about your project!</p>
					</div>
				</div>

				<script>
					const vscode = acquireVsCodeApi();
					
					// Tab switching logic
					document.querySelectorAll('.tab').forEach(tab => {
						tab.addEventListener('click', () => {
							// Remove active class from all tabs and contents
							document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
							document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
							
							// Add active class to clicked tab and corresponding content
							tab.classList.add('active');
							const tabId = tab.getAttribute('data-tab');
							document.getElementById(tabId).classList.add('active');
						});
					});

					// Chat functionality
					const chatInput = document.getElementById('chatInput');
					const chatMessages = document.getElementById('chatMessages');
					const sendButton = document.getElementById('sendMessage');

					function addMessage(content, isUser = false) {
						const messageDiv = document.createElement('div');
						messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
						messageDiv.textContent = content;
						chatMessages.appendChild(messageDiv);
						chatMessages.scrollTop = chatMessages.scrollHeight;
					}

					function handleMessage() {
						const message = chatInput.value.trim();
						if (message) {
							addMessage(message, true);
							chatInput.value = '';
							
							// Send message to extension
							vscode.postMessage({
								command: 'chat',
								message: message
							});
						}
					}

					sendButton.addEventListener('click', handleMessage);
					chatInput.addEventListener('keypress', (e) => {
						if (e.key === 'Enter') {
							handleMessage();
						}
					});

					// Existing button logic
					document.getElementById('startButton').addEventListener('click', () => {
						const appDescription = document.getElementById('appDescription').value;
						const repoStarter = document.getElementById('repoStarter').value;
						
						vscode.postMessage({
							command: 'start',
							appDescription,
							repoStarter
						});
					});
				</script>
			</body>
			</html>
		`;
	}

	private _setWebviewMessageListener(webview: vscode.Webview) {
		webview.onDidReceiveMessage(
			(message) => {
				switch (message.command) {
					case 'start':
						console.log('App Description:', message.appDescription);
						console.log('Repo Starter:', message.repoStarter);
						vscode.window.showInformationMessage('Starting app generation...');
						return;
					case 'chat':
						console.log('Chat message:', message.message);
						// Here you can handle the chat message and send a response back
						return;
				}
			},
			undefined,
			this._disposables
		);
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('allycoder.start', () => {
			WelcomePanelProvider.render(context);
		})
	);

	// Automatically open the panel when the extension starts
	WelcomePanelProvider.render(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('👋 AllyCoder Extension is now deactivated');
}
