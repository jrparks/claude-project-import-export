import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

suite('Claude Project Import-Export Extension Test Suite', () => {
  let tempDir: string;

  setup(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-'));
  });

  teardown(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('Export Command Exists', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(
      commands.includes('claude-project-import-export.exportProject'), 
      'Export Project command not found'
    );
  });

  test('Import Command Exists', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(
      commands.includes('claude-project-import-export.importProject'), 
      'Import Project command not found'
    );
  });

  test('Create Sample Project', async () => {
    // Create a sample project structure
    const projectPath = path.join(tempDir, 'sample-project');
    await fs.mkdir(projectPath, { recursive: true });
    
    // Create some sample files
    await fs.writeFile(path.join(projectPath, 'README.md'), '# Sample Project');
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    await fs.writeFile(path.join(projectPath, 'src', 'index.ts'), 'console.log("Hello, World!");');
    
    // Validate files were created
    const files = await fs.readdir(projectPath, { recursive: true });
    assert.ok(files.includes('README.md'), 'README.md not created');
    assert.ok(files.includes(path.join('src', 'index.ts')), 'index.ts not created');
  });

  // Note: Full export/import testing would require mocking vscode UI interactions
  // which is complex. These are basic smoke tests.
});