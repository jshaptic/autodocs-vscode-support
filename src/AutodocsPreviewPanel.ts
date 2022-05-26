import * as vscode from 'vscode'
import { dirname, join } from "path";
import * as constants from './constants';
import * as autodocs from './AutodocsHandlers';
import { AutodocsTemplate } from './AutodocsTemplate';

const cheerio = require('cheerio')
const PREFIX_LINK = 'qp';
const ATTRS = ['src', 'href'];

export default class AutodocsPreviewPanel {

    public static currentPanel: AutodocsPreviewPanel | undefined;
    
    private readonly _panel: vscode.WebviewPanel;
    private _textEditor: vscode.TextEditor | undefined;
    private _changedLinks = new Map<string, string>();

    constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._textEditor = vscode.window.activeTextEditor;

        // on dispose
        this._panel.onDidDispose(this.dispose);
    }

    public static render(viewColumn: number, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        if (AutodocsPreviewPanel.currentPanel) {
            AutodocsPreviewPanel.currentPanel._panel.reveal(viewColumn);
        } else {
            const panel = vscode.window.createWebviewPanel("template-preview", constants.ExtensionConstants.PREVIEW_TITLE, viewColumn, {
                enableScripts: true
            });
            AutodocsPreviewPanel.currentPanel = new AutodocsPreviewPanel(panel);
        }
        AutodocsPreviewPanel.currentPanel.refresh();
    }

    public refresh() {
        this.generateHTML().then(html => this._panel.webview.html = html);
    }

    public async generateHTML() {
        if (!this._textEditor) {
            return '';
        }

        let html = await autodocs.loadAutodocsBookmarks(new AutodocsTemplate(this._textEditor.document));
        html = this.fixLinks(html);
        html = this.replaceUrlToVscodeResource(html, this._textEditor.document.fileName)
        html = this.addChangedLinkContent(html);
        html = this.applyDefaulStyle(html);

        return html;
    }

    private fixLinks(html: string): string {
        if (!this._textEditor) {
            return html;
        }

        let htmlFilePath = this._textEditor.document.fileName;
        // return html;
        return html.replace(
            new RegExp(`((?:${ATTRS.join('|')})=[\'\"])((?!http|\\/).*?)([\'\"])`, "gmi"),
            (subString: string, p1: string, p2: string, p3: string): string => {
                let fsPath = vscode.Uri.file(join(
                    dirname(htmlFilePath),
                    p2
                )).fsPath;

                let changedLinkPath = this._changedLinks.get(fsPath);
                if (changedLinkPath) {
                    return [
                        `${PREFIX_LINK}-${p1}`,
                        fsPath,
                        p3
                    ].join("");
                } else {
                    return [
                        p1,
                        this.getVscodeResourcePath(p2, htmlFilePath),
                        p3
                    ].join("");
                }
            }
        );
    }

    private addChangedLinkContent(content: string): string {
        const $ = cheerio.load(content);
        ATTRS.forEach((value) => {
            let linkAttr = `${PREFIX_LINK}-${value}`;
            let $changedLink = $(`[${linkAttr}]`);
            if ($changedLink.length != 0) {
                let fsPath = $changedLink.attr(linkAttr);
                if ($changedLink[0].name === 'link') {
                    $changedLink.after(`
                        <style type="text/css">
                        ${this._changedLinks.get(fsPath)}
                        </style>`);
                } else {
                    $changedLink.html(this._changedLinks.get(fsPath));
                }
            }
        });

        return $.html();
    }

    setChangedLinks({ key, value }: {key: string, value: string}) {
        // translate image url as `url(./img/bg.png)`
        value = this.replaceUrlToVscodeResource(value, key)
        this._changedLinks.set(key, value);
    }

    clearChangedLinks() {
        this._changedLinks.clear();
    }

    getTextEditor(): vscode.TextEditor | undefined {
        return this._textEditor;
    }

    setTextEditor(te: vscode.TextEditor | undefined) {
        this._textEditor = te;
    }

    // Apply default styles so that HTML would be displayed corectly in VS Code
    private applyDefaulStyle(html: string): string {
        let defaultStyle = `
            <style>
            html {
                background: #e6e6e6;
            }
            body {
                color: initial;
                background: #fff;
                border: solid 1px #c6c6c6;
                margin: 10px auto;
                padding: 50px;
                max-width: 800px;
            }
            </style>`;
        return defaultStyle + html;
    }

    private replaceUrlToVscodeResource(content: string, hostFilePath: string): string {
        return content.replace(/(?:^|[^a-zA-Z0-9])url\((.*)\)/gmi, (subString, p1) => { return this.replaceUrlHandler(subString, p1, hostFilePath) })
    }

    private replaceUrlHandler(subString: string, p1: string, hostFilePath: string): string {
        if (p1.startsWith(`'`) && p1.endsWith(`'`) || p1.startsWith(`"`) && p1.endsWith(`"`)) {
            p1 = p1.substring(1, p1.length - 1)
        }
        if (p1.startsWith('http')) {
            return subString
        }
        const vscodePath = this.getVscodeResourcePath(p1, hostFilePath)
        return subString.replace(p1, vscodePath)
    }

    private getVscodeResourcePath(relativePath: string, hostFilePath: string): string {
        return vscode.Uri.file(join(
            dirname(hostFilePath),
            relativePath
        )).with({ scheme: 'vscode-resource' }).toString()
    }

    // dispose
    public dispose() {
        AutodocsPreviewPanel.currentPanel = undefined;
        this._panel.dispose();
    }
}
