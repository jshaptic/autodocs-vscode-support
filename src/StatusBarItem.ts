"use strict"
import * as vscode from 'vscode'
import * as utilities from "./utilities"
import * as constants from './Constants'

export default class StatusBarItem {

    statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBarItem.command = "extension.sidePreview";
        this.statusBarItem.tooltip = constants.ExtensionConstants.STATUS_BAR_TOOLTIP;
    }

    updateStatusbar() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            this.statusBarItem.hide();
            return;
        }
        // Only update status if an HTML file
        if (utilities.checkDocumentIsHTML(false)) {
            this.statusBarItem.text = constants.ExtensionConstants.STATUS_BAR_TEXT;
            this.statusBarItem.show();
        }
        else {
            this.statusBarItem.hide();
        }
    }
}