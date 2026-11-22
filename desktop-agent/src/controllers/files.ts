import * as fs from 'fs';
import * as path from 'path';
import { AgentConfig } from '../config';
import { isFilePathAllowed } from '../security/authorization';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  extension?: string;
}

export async function listDirectory(dirPath: string, config: AgentConfig): Promise<{ success: boolean; items?: FileItem[]; parentPath?: string; error?: string }> {
  const targetPath = (!dirPath || dirPath === '~' || dirPath === '.') ? config.allowedDirectories[0] : dirPath;
  const resolved = path.resolve(targetPath);
  if (!isFilePathAllowed(resolved, config)) {
    return { success: false, error: 'Access denied: directory not in allowed paths' };
  }

  try {
    const entries = await fs.promises.readdir(resolved, { withFileTypes: true });
    const items: FileItem[] = [];

    for (const entry of entries) {
      try {
        const fullPath = path.join(resolved, entry.name);
        const stat = await fs.promises.stat(fullPath);
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stat.size,
          modified: stat.mtime.toISOString(),
          extension: entry.isDirectory() ? undefined : path.extname(entry.name).slice(1),
        });
      } catch {
        // Skip inaccessible items
      }
    }

    items.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return { success: true, items, parentPath: path.dirname(resolved) };
  } catch (err: any) {
    return { success: false, error: `Failed to list directory: ${err.message}` };
  }
}

export async function createFolder(dirPath: string, name: string, config: AgentConfig): Promise<{ success: boolean; error?: string }> {
  const fullPath = path.join(path.resolve(dirPath), name);
  if (!isFilePathAllowed(fullPath, config)) {
    return { success: false, error: 'Access denied' };
  }

  try {
    await fs.promises.mkdir(fullPath, { recursive: false });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function renameItem(itemPath: string, newName: string, config: AgentConfig): Promise<{ success: boolean; error?: string }> {
  const resolved = path.resolve(itemPath);
  if (!isFilePathAllowed(resolved, config)) {
    return { success: false, error: 'Access denied' };
  }

  const newPath = path.join(path.dirname(resolved), newName);
  if (!isFilePathAllowed(newPath, config)) {
    return { success: false, error: 'Access denied for target path' };
  }

  try {
    await fs.promises.rename(resolved, newPath);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteItem(itemPath: string, config: AgentConfig): Promise<{ success: boolean; error?: string }> {
  const resolved = path.resolve(itemPath);
  if (!isFilePathAllowed(resolved, config)) {
    return { success: false, error: 'Access denied' };
  }

  try {
    const stat = await fs.promises.stat(resolved);
    if (stat.isDirectory()) {
      await fs.promises.rm(resolved, { recursive: true });
    } else {
      await fs.promises.unlink(resolved);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getFileContent(filePath: string, config: AgentConfig): Promise<{ success: boolean; content?: string; fileName?: string; size?: number; error?: string }> {
  const resolved = path.resolve(filePath);
  if (!isFilePathAllowed(resolved, config)) {
    return { success: false, error: 'Access denied' };
  }

  try {
    const stat = await fs.promises.stat(resolved);
    if (stat.size > config.maxFileSize) {
      return { success: false, error: `File too large (max ${config.maxFileSize / 1024 / 1024}MB)` };
    }
    const buffer = await fs.promises.readFile(resolved);
    return {
      success: true,
      content: buffer.toString('base64'),
      fileName: path.basename(resolved),
      size: stat.size,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveFile(dirPath: string, fileName: string, content: string, config: AgentConfig): Promise<{ success: boolean; error?: string }> {
  const fullPath = path.join(path.resolve(dirPath), fileName);
  if (!isFilePathAllowed(fullPath, config)) {
    return { success: false, error: 'Access denied' };
  }

  try {
    const buffer = Buffer.from(content, 'base64');
    if (buffer.length > config.maxFileSize) {
      return { success: false, error: `File too large (max ${config.maxFileSize / 1024 / 1024}MB)` };
    }
    await fs.promises.writeFile(fullPath, buffer);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
