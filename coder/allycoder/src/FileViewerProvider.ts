import * as vscode from 'vscode';

export class FileViewerProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.type) {
                case 'createApp':
                    console.log('App description:', message.description);
                    // Create a terminal and run the create-next-app command
                    const terminal = vscode.window.createTerminal('Next.js App');
                    terminal.sendText('npx create-next-app@latest my-app --typescript --tailwind --eslint');
                    terminal.show();
                    break;
            }
        });

        this._updateWebview();
    }

    private _updateWebview() {
        if (!this._view) {
            return;
        }

        this._view.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>App Creator</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: sans-serif;
                    }
                    .form-group {
                        margin-bottom: 15px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                    }
                    textarea {
                        width: 100%;
                        min-height: 100px;
                        margin-bottom: 10px;
                        padding: 8px;
                    }
                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        cursor: pointer;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="form-group">
                    <label for="appDescription">Describe your app:</label>
                    <textarea id="appDescription" placeholder="Enter your app description here..."></textarea>
                </div>
                <button id="submitBtn">Create App</button>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    document.getElementById('submitBtn').addEventListener('click', () => {
                        const description = document.getElementById('appDescription').value;
                        vscode.postMessage({
                            type: 'createApp',
                            description: description
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }
}