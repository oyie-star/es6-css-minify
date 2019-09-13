import * as vscode from 'vscode';
import { config, reloadConfig } from './config';
import { statusBar } from './status-bar';
import { EXT_ID, SUPPORTED_FILES, isMinified, getOutPath } from './utils';
import { output } from './output';
import { File } from './fs';
import { minifyDocument } from './minify-document';
import { minifySelection } from './minify-selection';

export function activate(context: vscode.ExtensionContext): void {

    // Load config
    reloadConfig(true);


    // Show minify button
    if (config.hideButton === 'never' || config.hideButton === false) {
        statusBar.showButton();
    }


    // Commands
    context.subscriptions.push(

        // Reload config.
        vscode.commands.registerCommand(`${EXT_ID}.loadConfig`, () => {

            reloadConfig(true);
            if (config.hideButton === 'never') {
                statusBar.showButton();
            } else if (config.hideButton === 'always') {
                statusBar.hideButton();
            }
            vscode.window.showInformationMessage('Minify configuration reloaded.');

        }),


        // Minify file.
        vscode.commands.registerCommand(`${EXT_ID}.minify`, () => {

            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('No document open.');
                return;
            }

            if (editor.document.isUntitled) {
                vscode.window.showErrorMessage('File must be saved before it can be minified.');
                return;
            }

            minifyDocument(editor.document);

        }),


        // Minify selection.
        vscode.commands.registerCommand(`${EXT_ID}.minifySelection`, () => {

            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('No editor open.');
                return;
            }

            minifySelection(editor);

        }),


        // Export config for easy debug.
        vscode.commands.registerCommand(`${EXT_ID}.exportConfig`, () => {

            vscode.workspace.openTextDocument({ language: 'json', content: JSON.stringify(config, null, 4)})
            .then(doc => {
                vscode.window.showTextDocument(doc);
            });

        })

    );


    // Minify on save.
    vscode.workspace.onDidSaveTextDocument(doc => {

        if (config.minifyOnSave === false || config.minifyOnSave === 'no' || !SUPPORTED_FILES.includes(doc.languageId)) {
            return;
        }

        if (config.minifyOnSave === 'exists') {
            if (!new File(getOutPath(doc)).exists()) {
                return;
            }
        }

        // This is a hack to get arround bad/old hardware.
        if (config.onSaveDelay) {
            setTimeout(() => {
                minifyDocument(doc);
            }, config.onSaveDelay);
        } else {
            minifyDocument(doc);
        }

    });


    // Hide the minify button unless the active document is a non-minified JS/CSS file.
    vscode.workspace.onDidOpenTextDocument(() => {

        if (vscode.window.activeTextEditor && (config.hideButton === 'auto' || config.hideButton === true)) {
            const doc = vscode.window.activeTextEditor.document;
            if (SUPPORTED_FILES.includes(doc.languageId) && !isMinified(doc)) {
                statusBar.showButton();
            } else {
                statusBar.hideButton();
            }
        }

    });


    // Reload minify config if the vscode config is modified
    vscode.workspace.onDidChangeConfiguration(e => {

        if (e.affectsConfiguration(EXT_ID)) {

            reloadConfig(true);
            if (config.hideButton === 'never') {
                statusBar.showButton();
            } else if (config.hideButton === 'always') {
                statusBar.hideButton();
            }
            vscode.window.showInformationMessage('Minify configuration reloaded.');

        }

    });


    console.log('es6-css-minify 3 is now active!');

}

export function deactivate(): void {
    output.dispose();
}
