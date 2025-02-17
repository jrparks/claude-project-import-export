"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
suite('Claude Project Import-Export Extension Test Suite', () => {
    let tempDir;
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
        assert.ok(commands.includes('claude-project-import-export.exportProject'), 'Export Project command not found');
    });
    test('Import Command Exists', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('claude-project-import-export.importProject'), 'Import Project command not found');
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
//# sourceMappingURL=extension.test.js.map