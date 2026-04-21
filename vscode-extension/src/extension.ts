import * as vscode from 'vscode';
import * as http from 'http';

let intervalId: NodeJS.Timeout;

export function activate(context: vscode.ExtensionContext) {
    console.log('The Witness extension is now active!');

    // Command to manually trigger
    let disposable = vscode.commands.registerCommand('witness.start', () => {
        vscode.window.showInformationMessage('The Witness is now observing your mind state.');
        startMonitoring();
    });

    context.subscriptions.push(disposable);
    
    // Auto-start
    startMonitoring();
}

function startMonitoring() {
    let lastInterventionMsg = "";

    intervalId = setInterval(() => {
        http.get('http://127.0.0.1:8000/intervention', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.intervention && parsed.intervention.message && parsed.intervention.message !== lastInterventionMsg) {
                        lastInterventionMsg = parsed.intervention.message;
                        showZenOverlay(lastInterventionMsg, parsed.intervention.event);
                    }
                } catch (e) {
                    // silent ignore, server might be down
                }
            });
        }).on('error', (err) => {
            // silent ignore
        });
    }, 5000);
}

function showZenOverlay(message: string, event: string) {
    // Dim the code and show non-dual message
    const panel = vscode.window.createWebviewPanel(
        'witnessIntervention',
        'The Witness',
        vscode.ViewColumn.Active,
        { enableScripts: true }
    );

    panel.webview.html = getWebviewContent(message, event);
}

function getWebviewContent(message: string, event: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            background-color: #0f172a;
            color: #e2e8f0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: 'Inter', -apple-system, sans-serif;
            text-align: center;
            flex-direction: column;
            overflow: hidden;
        }
        .container {
            max-width: 600px;
            animation: fadeIn 2s ease-in-out;
        }
        .event {
            font-size: 0.9em;
            color: #ef4444;
            margin-bottom: 20px;
            font-family: monospace;
            opacity: 0.8;
            word-wrap: break-word;
        }
        .message {
            font-size: 1.5em;
            line-height: 1.6;
            font-weight: 300;
        }
        @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="event">${event || 'System Stress Detected'}</div>
        <div class="message">"${message}"</div>
    </div>
</body>
</html>`;
}

export function deactivate() {
    if (intervalId) {
        clearInterval(intervalId);
    }
}
