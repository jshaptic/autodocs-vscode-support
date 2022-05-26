import * as vscode from 'vscode';
import { resolve, dirname } from 'path';
import * as constants from './constants';

export class AutodocsTemplate {

    private text: string;
    private filename: string;
    private sampleDataFilename: string;
    private translationsFilename: string = 'translations.json'; 

    // Bookmarks
    private literals: Array<AutodocsBookmark> | undefined;
    private simpleBookmarks: Array<AutodocsBookmark> | undefined;
    private repeatingBlocks: Array<AutodocsRepeatingBlock> | undefined;
    
    constructor(document: vscode.TextDocument) {
        this.text = document.getText();
        this.filename = document.fileName;
        this.sampleDataFilename = document.fileName + constants.ExtensionConstants.SAMPLE_FILE_SUFFIX;
        this.translationsFilename = resolve(dirname(document.fileName), constants.ExtensionConstants.TRANSLATIONS_FILENAME);
        this.parse();
    }

    private parse() {
        this.literals = [...this.text.matchAll(/{{([^}]+?)}}/gm)].map(p => new AutodocsBookmark(this, p[1], p[0]));
        this.simpleBookmarks = [...this.text.matchAll(/<%([^%>]+?)%>/gm)].map(p => new AutodocsBookmark(this, p[1], p[0]));
        this.repeatingBlocks = [...this.text.matchAll(/\[%(.+?)%\]/gms)].map(block => {
            const bookmarks = [...block[1].matchAll(/<%([^%>]+?)%>/gm)].map(p => p[1]);
            this.simpleBookmarks = this.simpleBookmarks?.filter(b => !bookmarks?.includes(b.getName()));
            return new AutodocsRepeatingBlock(this, block[1], bookmarks?.map(n => new AutodocsBookmark(this, n, '<%' + n + '%>')) || []);
        });
    }

    public getText() {
        return this.text;
    }

    public setText(text: string) {
        this.text = text;
    }

    public getFilename() {
        return this.filename;
    }

    public getSampleDataFilename() {
        return this.sampleDataFilename;
    }

    public getTranslationsFilename() {
        return this.translationsFilename;
    }

    public getLiterals() {
        return this.literals;
    }

    public getSimpleBookmarks() {
        return this.simpleBookmarks;
    }

    public getRepeatingBlocks() {
        return this.repeatingBlocks;
    }

}

export class AutodocsBookmark {
    private _template;
    private _name;
    private _token;

    constructor(template: AutodocsTemplate, name: string, token: string) {
        this._template = template;
        this._name = name;
        this._token = token;
    }

    public getTemplate() {
        return this._template;
    }

    public getName() {
        return this._name;
    }

    public getToken() {
        return this._token;
    }

    public replaceWith(value: any) {
        this._template.setText(this._template.getText().replaceAll(this._token, value));
    }
}

export class AutodocsRepeatingBlock {
    private _template;
    private _block;
    private _bookmarks;

    constructor(template: AutodocsTemplate, block: string, bookmarks: Array<AutodocsBookmark>) {
        this._template = template;
        this._block = block;
        this._bookmarks = bookmarks;
    }

    public replaceWith(recordSet: Array<any>) {
        let result = '';
        recordSet.forEach(r => {
            let record = this._block;
            this._bookmarks.forEach(b => {
                record = record.replaceAll(b.getToken(), r[b.getName()]);
            });
            result += record;
        });
        this._template.setText(this._template.getText().replaceAll('[%' + this._block + '%]', result));
    }

    public getBlock() {
        return this._block;
    }

    public getBookmarks() {
        return this._bookmarks;
    }
}