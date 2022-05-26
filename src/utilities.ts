import * as vscode from 'vscode';
import * as constants from './Constants'
  
//returns true if an html document is open
export function checkDocumentIsHTML(showWarning: boolean): boolean {
    if (!vscode.window.activeTextEditor) {
        return false;
    }

    const languageId = vscode.window.activeTextEditor.document.languageId.toLowerCase();
    let result = (languageId === "html" || languageId === "xhtml")
    if (!result && showWarning) {
        vscode.window.showInformationMessage(constants.ErrorMessages.NO_HTML);
    }
    return result;
}
