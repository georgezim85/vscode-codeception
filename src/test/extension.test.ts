import * as assert from 'assert';
import * as vscode from 'vscode';
import { join as pathJoin } from 'path';
import { _getLastCommand } from '../extension';

const waitToAssertInSeconds = 5;

// This is a little helper function to promisify setTimeout, so we can 'await' setTimeout.
function timeout(seconds: number, callback: any) {
    return new Promise(resolve => {
        setTimeout(() => {
            callback();
            resolve();
        }, seconds * 5);
    });
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

describe('VSCode Codeception Test Suite', () => {
    const configuration = vscode.workspace.getConfiguration('vscode-codeception');
    let workspaceRootPath = vscode.workspace.rootPath || '';

    // Fix CI tests path
    if (!workspaceRootPath.endsWith('/project-stub')) {
        workspaceRootPath = pathJoin(workspaceRootPath, 'project-stub');
    }

    beforeEach(async () => {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        await configuration.update('commandSuffix', null);
        await configuration.update('codeceptBinary', null);
    });

    afterEach(async () => {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        await configuration.update('commandSuffix', null);
        await configuration.update('codeceptBinary', null);
    });

    it('Can test all files', async () => {
        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'unit', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await delay(1000); // Avoids "command not found" error at first test
        await vscode.commands.executeCommand('vscode-codeception.run-all');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(_getLastCommand().output, 'run');
        });
    });

    it('Can test a file', async () => {
        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'unit', 'ExampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('vscode-codeception.run-file');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(_getLastCommand().output, 'run unit tests/unit/ExampleTest.php');
        });
    });

    it('Does update the codeception binary if configured', async () => {
        await configuration.update('codeceptBinary', '/Users/test/codecept');

        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'unit', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('vscode-codeception.run-all');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(_getLastCommand().binary, '/Users/test/codecept');
        });
    });

    it('Does add the suffix from configuration if it is supplied', async () => {
        await configuration.update('commandSuffix', '--debug');

        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'unit', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('vscode-codeception.run-all');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(_getLastCommand().output, 'run --debug');
        });
    });
});
