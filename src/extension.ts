import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

// Ignore these directories and file types
const IGNORE_DIRS = [
  '.git', 
  'node_modules', 
  '.vscode', 
  'dist', 
  'build', 
  'out'
];

const IGNORE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', 
  '.woff', '.woff2', '.ttf', '.eot', 
  '.zip', '.tar', '.gz', '.rar', 
  '.exe', '.dll', '.so', '.dylib',
  '.lock', '.log', '.vsix', 
  '.claude'
];

const IGNORE_FILES = [
  'package-lock.json'
];

export function activate(context: vscode.ExtensionContext) {
  // Export Project Command
  const exportCommand = vscode.commands.registerCommand(
    'claude-project-import-export.exportProject', 
    async () => {
      let projectRoot: string | undefined;

      // Option to manually select project folder
      const selection = await vscode.window.showQuickPick([
        'Select from Open Workspace',
        'Manually Choose Project Folder'
      ], {
        placeHolder: 'Choose project export method'
      });

      if (selection === 'Select from Open Workspace') {
        // Workspace folder selection logic
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          vscode.window.showErrorMessage('No workspace folder selected');
          return;
        }

        if (workspaceFolders.length > 1) {
          const folder = await vscode.window.showWorkspaceFolderPick({
            placeHolder: 'Select a workspace folder to export'
          });
          projectRoot = folder?.uri.fsPath;
        } else {
          projectRoot = workspaceFolders[0].uri.fsPath;
        }
      } else {
        // Manual folder selection
        const folderUri = await vscode.window.showOpenDialog({
          canSelectMany: false,
          canSelectFolders: true,
          canSelectFiles: false,
          openLabel: 'Select Project Folder'
        });

        if (folderUri && folderUri.length > 0) {
          projectRoot = folderUri[0].fsPath;
        }
      }

      if (!projectRoot) {
        vscode.window.showInformationMessage('No folder selected for export');
        return;
      }

      // Confirm project root
      const confirmRoot = await vscode.window.showInformationMessage(
        `Selected project folder: ${projectRoot}`, 
        'Confirm', 'Change Folder'
      );

      if (confirmRoot === 'Change Folder') {
        // Restart the selection process
        return vscode.commands.executeCommand('claude-project-import-export.exportProject');
      }

      // Suggest default filename based on project folder name
      const defaultFileName = path.basename(projectRoot) + '.claude';

      // Prompt for filename
      const fileName = await vscode.window.showInputBox({
        prompt: 'Enter export file name',
        value: defaultFileName,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Filename cannot be empty';
          }
          // Ensure .claude extension
          return value.endsWith('.claude') ? null : 'Filename must end with .claude';
        }
      });

      if (!fileName) {
        vscode.window.showInformationMessage('Export cancelled');
        return;
      }

      // Prompt for save location
      const exportUri = await vscode.window.showSaveDialog({
        saveLabel: 'Export Project',
        defaultUri: vscode.Uri.file(path.join(projectRoot, fileName)),
        filters: {
          'Claude Project Export': ['claude']
        }
      });

      if (!exportUri) {
        return;
      }

      // Ensure the file has .claude extension
      let exportPath = exportUri.fsPath;
      if (!exportPath.endsWith('.claude')) {
        exportPath += '.claude';
      }

      try {
        // Show progress
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'Exporting Project',
          cancellable: false
        }, async (progress) => {
          // Write project export
          await exportProjectToFile(projectRoot!, exportPath, progress);
        });

        vscode.window.showInformationMessage(`Project exported to ${exportPath}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Export failed: ${error instanceof Error ? error.message : error}`);
      }
    }
  );

  // Import Project Command
  const importCommand = vscode.commands.registerCommand(
    'claude-project-import-export.importProject', 
    async () => {
      let importSource: string | undefined;

      // Choose import method
      const importMethod = await vscode.window.showQuickPick([
        'Select .claude File',
        'Paste from Clipboard'
      ], {
        placeHolder: 'Choose import method'
      });

      if (importMethod === 'Select .claude File') {
        // File selection
        const fileUri = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: {
            'Claude Project Export': ['claude']
          },
          title: 'Select Claude Project Export File'
        });

        if (fileUri && fileUri.length > 0) {
          importSource = await fsPromises.readFile(fileUri[0].fsPath, 'utf-8');
        }
      } else {
        // Clipboard import
        importSource = await vscode.env.clipboard.readText();
      }

      if (!importSource) {
        vscode.window.showInformationMessage('No import source selected');
        return;
      }

      // Validate import source
      if (!importSource.includes('# Project Structure:') || 
          !importSource.includes('## 📄 File Contents')) {
        vscode.window.showErrorMessage('Invalid Claude Project Export format');
        return;
      }

      // Select destination folder
      const destinationUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFolders: true,
        canSelectFiles: false,
        title: 'Select Destination Folder for Project'
      });

      if (!destinationUri || destinationUri.length === 0) {
        vscode.window.showInformationMessage('Import cancelled');
        return;
      }

      const destinationPath = destinationUri[0].fsPath;

      // Parsing and file creation
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Importing Project',
        cancellable: false
      }, async (progress) => {
        try {
          await importProjectFiles(importSource, destinationPath, progress);
          vscode.window.showInformationMessage(`Project imported to ${destinationPath}`);
        } catch (error) {
          vscode.window.showErrorMessage(`Import failed: ${error instanceof Error ? error.message : error}`);
        }
      });
    }
  );

  // Add commands to subscriptions
  context.subscriptions.push(exportCommand, importCommand);
}

async function exportProjectToFile(
  rootPath: string, 
  exportPath: string, 
  progress?: vscode.Progress<{increment?: number, message?: string}>
) {
  // Create write stream using standard fs
  const writeStream = fs.createWriteStream(exportPath);

  // Write a styled header
  writeStream.write(`# 📂 Project Export: ${path.basename(rootPath)}\n\n`);
  writeStream.write(`**Exported on:** ${new Date().toLocaleString()}\n\n`);
  writeStream.write(`---\n\n`);

  // Function to generate project structure
  async function generateProjectStructure(rootDir: string): Promise<string> {
    const structure: string[] = [];

    async function traverseDir(dir: string, prefix: string = '') {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      
      entries.sort((a, b) => a.name.localeCompare(b.name));

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);

        // Skip ignored directories
        if (IGNORE_DIRS.some(ignoredDir => 
          relativePath.split(path.sep).includes(ignoredDir)
        )) {
          continue;
        }

        // Determine tree prefix
        const isLast = i === entries.length - 1;
        const currentPrefix = isLast ? '└── ' : '├── ';

        if (entry.isDirectory()) {
          structure.push(`${prefix}${currentPrefix}${entry.name}/`);
          await traverseDir(
            fullPath, 
            prefix + (isLast ? '    ' : '│   ')
          );
        } else {
          // Skip files with ignored extensions
          const ext = path.extname(entry.name).toLowerCase();
          if (!IGNORE_EXTENSIONS.includes(ext)) {
            structure.push(`${prefix}${currentPrefix}${entry.name}`);
          }
        }
      }
    }

    // Start traversing from root
    await traverseDir(rootDir);

    return structure.join('\n');
  }

  // Generate project structure
  const projectStructure = await generateProjectStructure(rootPath);

  // Write project structure with a section header
  writeStream.write("## 🌳 Project Structure\n\n");
  writeStream.write("```\n");
  writeStream.write(projectStructure);
  writeStream.write("\n```\n\n");
  writeStream.write(`---\n\n`);

  // Write a section header for file contents
  writeStream.write("## 📄 File Contents\n\n");

  // Recursive function to traverse directories
  async function traverseDirectory(dirPath: string) {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Construct full path
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);

      // Skip ignored directories and files
      if (IGNORE_DIRS.some(ignoredDir => 
        relativePath.split(path.sep).includes(ignoredDir)
      ) || IGNORE_FILES.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively traverse subdirectories
        await traverseDirectory(fullPath);
      } else {
        // Skip files with ignored extensions
        const ext = path.extname(entry.name).toLowerCase();
        if (IGNORE_EXTENSIONS.includes(ext)) {
          continue;
        }

        try {
          // Read file contents
          const fileContent = await fsPromises.readFile(fullPath, 'utf-8');
          
          // Write to export file in improved format
          writeStream.write(`### 📝 \`${relativePath}\`\n\n`);
          
          // Determine language for code block, but only add if not empty
          const language = path.extname(entry.name).slice(1);
          writeStream.write('```' + (language ? language : '') + '\n');
          writeStream.write(fileContent);
          writeStream.write('\n```\n\n');
          writeStream.write(`---\n\n`);

          // Update progress (if available)
          if (progress) {
            progress.report({ message: `Exported: ${relativePath}` });
          }
        } catch (error) {
          // Log errors but continue processing
          console.error(`Error reading file ${fullPath}:`, error);
        }
      }
    }
  }

  // Start traversing from root
  await traverseDirectory(rootPath);

  // Close write stream
  writeStream.end();

  return new Promise<void>((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

async function importProjectFiles(
  fileContent: string, 
  destinationPath: string,
  progress?: vscode.Progress<{increment?: number, message?: string}>
) {
  // Split file contents into individual file sections
  const fileBlocks = fileContent.split(/^### 📝 `/m).slice(1);

  for (const block of fileBlocks) {
    // Extract file path and content
    const [pathLine, ...contentLines] = block.split('\n```');
    const filePath = pathLine.trim().replace(/`/g, '');
    const fileContent = contentLines[0].trim();

    // Construct full destination path
    const fullDestPath = path.join(destinationPath, filePath);

    // Ensure directory exists
    await fsPromises.mkdir(path.dirname(fullDestPath), { recursive: true });

    // Write file
    await fsPromises.writeFile(fullDestPath, fileContent);

    // Update progress
    if (progress) {
      progress.report({ message: `Imported: ${filePath}` });
    }
  }
}

export function deactivate() {}