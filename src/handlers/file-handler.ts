import fs from 'fs';
import path from 'path';

export default class FileHandler {
  static createFolder(folderName: string): string {
    const folderPath = path.join('.', folderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    return folderPath;
  }

  static emptyFolder(folderName: string): void {
    const folderPath = path.join('.', folderName);
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        fs.unlinkSync(filePath);
      });
    }
  }

  static getFolderFilenameFullPaths(folderPath: string): string[] {
    const filenames = fs.readdirSync(folderPath).map((filename) => {
      return path.join('.', folderPath, filename);
    });
    return filenames;
  }

  private static getPathByFilename(folder: string, filename: string): string {
    FileHandler.createFolder(folder);
    const filePath = path.join(folder, filename);
    return filePath;
  }

  static saveStringToFile(
    folder: string,
    filename: string,
    content: string
  ): string {
    const pathToSave = FileHandler.getPathByFilename(folder, filename);
    fs.writeFileSync(pathToSave, content);
    return pathToSave;
  }

  static saveArrayBufferToFile(
    folder: string,
    filename: string,
    content: Buffer
  ): string {
    const pathToSave = FileHandler.getPathByFilename(folder, filename);
    fs.writeFileSync(pathToSave, content);
    return pathToSave;
  }

  static readFile(baseDir: string, filePath: string) {
    try {
      const fullPath = path.join(baseDir, filePath);
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      const data = fs.readFileSync(fullPath, 'utf8');
      return data;
    }
    catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  writeFile(baseDir: string, filePath: string, content: string) {
    try {
      const fullPath = path.join(baseDir, filePath);
      fs.writeFileSync(fullPath, content, 'utf8');
      return true;
    }
    catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  appendToFile(baseDir: string, filePath: string, content: string) {
    try {
      const fullPath = path.join(baseDir, filePath);
      fs.appendFileSync(fullPath, content, 'utf8');
      return true;
    }
    catch (error) {
      console.error('Error appending to file:', error);
      return false;
    }
  }
}
