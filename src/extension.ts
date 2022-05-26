import * as vscode from 'vscode';
import * as constants from './constants';
import AutodocsPreviewPanel from './AutodocsPreviewPanel';
import StatusBarItem from './StatusBarItem';
import { AutodocsTemplate } from './AutodocsTemplate';
import * as autodocs from './AutodocsHandlers';
import PreviewManager from './EventHandler';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let statusBarItem = new StatusBarItem();
    statusBarItem.updateStatusbar();

    // Subscribe so that the statusBarItem gets updated
    vscode.window.onDidChangeActiveTextEditor(statusBarItem.updateStatusbar, statusBarItem, context.subscriptions);
    let previewUri = vscode.Uri.parse(constants.ExtensionConstants.PREVIEW_URI);

    // Register the commands that are provided to the user
    let disposableSidePreview = vscode.commands.registerCommand('extension.sidePreview', () => {
        AutodocsPreviewPanel.render(vscode.ViewColumn.Two, previewUri, context);
    });
    let disposableStandalonePreview = vscode.commands.registerCommand('extension.fullPreview', () => {
        AutodocsPreviewPanel.render(vscode.ViewColumn.One, previewUri, context);
    });
    let disposableSampleGenerator = vscode.commands.registerCommand('extension.generateSampleData', () => {
        if (vscode.window.activeTextEditor) {
            autodocs.generateBookmarks(new AutodocsTemplate(vscode.window.activeTextEditor.document));
        }
    });

    let eventHandler = new PreviewManager();

    vscode.workspace.onDidChangeTextDocument(eventHandler.onChangeTextContent, eventHandler);
    vscode.window.onDidChangeActiveTextEditor(eventHandler.onChangeActiveEditor, eventHandler);

    // push to subscriptions list so that they are disposed automatically
    context.subscriptions.push(disposableSidePreview);
    context.subscriptions.push(disposableStandalonePreview);
    context.subscriptions.push(disposableSampleGenerator);
}

// this method is called when your extension is deactivated
export function deactivate() {}
