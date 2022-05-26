import * as vscode from 'vscode';
import AutodocsPreviewPanel from './AutodocsPreviewPanel';

// This class initializes the previewmanager based on extension type and manages all the subscriptions
export default class PreviewManager {

    delayTime: number = 100

    public onChangeTextContent(e: vscode.TextDocumentChangeEvent) {
        switch (vscode.window.activeTextEditor?.document.languageId.toLowerCase()) {
            case 'javascript':
                this.debounce(this.refreshJavascriptContent, this.delayTime)(e);
                break;
            case 'css':
                this.debounce(this.refreshCssContent, this.delayTime)(e);
                break;
            case 'html':
            case 'xhtml':
            case 'json':
                this.debounce(this.refreshHMTLContent, this.delayTime)(e);
                break;
        }
    }

    public onChangeActiveEditor(e: vscode.TextEditor | undefined) {
        if (AutodocsPreviewPanel.currentPanel?.getTextEditor() != e) {
            switch (vscode.window.activeTextEditor?.document.languageId.toLowerCase()) {
                case 'html':
                case 'xhtml':
                    AutodocsPreviewPanel.currentPanel?.setTextEditor(e);
                    AutodocsPreviewPanel.currentPanel?.refresh();
                    break;
            }
        }
    }

    private debounce(fun : any, delay: number) {
        return (args : any) => {
            clearTimeout(fun.id);
            fun.id = setTimeout(() => fun.call(this, args), delay);
        }
    }

    private refreshJavascriptContent(e: vscode.TextDocumentChangeEvent) {
        this.updateLinkData(e);
        AutodocsPreviewPanel.currentPanel?.refresh();
    }

    private refreshCssContent(e: vscode.TextDocumentChangeEvent) {
        this.updateLinkData(e);
        AutodocsPreviewPanel.currentPanel?.refresh();
    }

    private refreshHMTLContent() {
        AutodocsPreviewPanel.currentPanel?.refresh();
    }

    private updateLinkData(e: vscode.TextDocumentChangeEvent) {
        let editorData = {
            key: e.document.fileName,
            value: e.document.getText()
        };
        AutodocsPreviewPanel.currentPanel?.setChangedLinks(editorData);
    }
}
