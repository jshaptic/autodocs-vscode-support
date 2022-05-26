import * as vscode from 'vscode';
import { resolve, dirname } from 'path';
import { AutodocsTemplate, AutodocsBookmark, AutodocsRepeatingBlock } from './AutodocsTemplate';

async function getData(fileName: string) {
    try {
        return JSON.parse((await vscode.workspace.openTextDocument(fileName)).getText());
    } catch(e) {
        return {};
    }
}

async function getOrCreateData(fileName: string) {
    try {
        return JSON.parse((await vscode.workspace.openTextDocument(fileName)).getText());
    } catch(e) {
        await writeFile(fileName, {});
        return JSON.parse((await vscode.workspace.openTextDocument(fileName)).getText());
    }
}

async function writeFile(fileName: string, content: object) {
    await vscode.workspace.fs.writeFile(vscode.Uri.file(fileName), Buffer.from(JSON.stringify(content, null, 2), 'utf8'));
}

export async function loadAutodocsBookmarks(template: AutodocsTemplate): Promise<string> {
    const translations = await getData(template.getTranslationsFilename());
    const sampleData = await getData(template.getSampleDataFilename());
    
    template.getLiterals()?.forEach(l => l.replaceWith(translations[l.getName()] || l.getToken()));
    const bookmarks = template.getSimpleBookmarks() || [];
    for (let i = 0; i < bookmarks.length; i++) {
        bookmarks[i].replaceWith((await getBookmarkData(sampleData, bookmarks[i])) || bookmarks[i].getToken());
    }
    template.getRepeatingBlocks()?.forEach(b => b.replaceWith(getBlockData(sampleData, b) || []))

    return template.getText();
}

export async function generateBookmarks(template: AutodocsTemplate) {
    const translations = await getOrCreateData(template.getTranslationsFilename());

    template.getLiterals()?.forEach(literal => {
        if (!translations[literal.getName()]) {
            translations[literal.getName()] = literal.getName();
        }
    });

    writeFile(template.getTranslationsFilename(), translations);

    const sampleData = await getOrCreateData(template.getSampleDataFilename());

    template.getSimpleBookmarks()?.forEach(bookmark => {
        if (!sampleData[bookmark.getName()]) {
            sampleData[bookmark.getName()] = bookmark.getName();
        }
    });

    let i = 0;
    template.getRepeatingBlocks()?.forEach(block => {
        const blockData = getBlockData(sampleData, block);
        if (blockData) {
            block.getBookmarks().forEach(bookmark => {
                blockData.forEach((record: any) => {
                    if (!record[bookmark.getName()]) {
                        record[bookmark.getName()] = bookmark.getName();
                    }
                });
            });
        } else {
            sampleData['BLOCK_' + i++] = [block.getBookmarks().reduce((a, b) => ({ ...a, [b.getName()]: b.getName()}), {})];
        }
    });

    writeFile(template.getSampleDataFilename(), sampleData);
}

async function getBookmarkData(data: any, bookmark: AutodocsBookmark) {
    let value = data[bookmark.getName()];
    if (value && (typeof value == 'object' && !Array.isArray(value) && value != null)) {
        if (value['import']) {
            return (await vscode.workspace.openTextDocument(resolve(dirname(bookmark.getTemplate().getFilename()), value['import']))).getText();
        }
    } else if (value) {
        return value;
    } else {
        return undefined;
    }
}

function getBlockData(data: any, block: AutodocsRepeatingBlock) {
    const name = Object.keys(data)
        .find(k => Array.isArray(data[k])
            && data[k].some((record: any) => Object.keys(record).some(field => block.getBookmarks().some(b => field == b.getName()))));
    if (name) {
        return data[name];
    } else {
        return undefined;
    }
}