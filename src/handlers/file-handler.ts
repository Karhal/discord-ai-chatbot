import fs from 'fs';
import path from 'path';
import ConfigManager from '../configManager';
const configBackup = ConfigManager.config.backupFile;

export default class FileHandler {
  baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private static getBackupFileByConfig(): string {
    const pathConfig = configBackup.path;
    if (pathConfig.indexOf('/') == 0) {
      //Absolute path for linux
      return pathConfig;
    }
    if (/^[A-Z]:\/\//.test(pathConfig)) {
      //Absolute path for Windows
      return pathConfig;
    }
    //For non absolute path, we get compatibility for all environnements
    let pathSplit = null;
    if (pathConfig.indexOf('/') > 0) {
      pathSplit = pathConfig.split('/');
    }
    else if (pathConfig.indexOf('\\') > 0) {
      pathSplit = pathConfig.split('\\');
    }
    if (pathSplit) {
      return path.join.apply(null, pathSplit);
    }
    //simple folder in root path
    return path.join('.', pathConfig);
  }

  private static createTmpFolder(): string {
    const pathTmpFolder = path.join('.', '..', 'tmp');
    if (!fs.existsSync(pathTmpFolder)) {
      fs.mkdirSync(pathTmpFolder);
    }
    return pathTmpFolder;
  }

  private static createBackupFile(): string {
    const pathBackupFile = this.getBackupFileByConfig();
    if (!fs.existsSync(pathBackupFile)) {
      fs.mkdirSync(pathBackupFile);
    }
    return pathBackupFile;
  }

  private static getTmpPathByFilename(filename: string): string {
    const tmpFolder = FileHandler.createTmpFolder();
    const filePath = path.join(tmpFolder, filename);
    return filePath;
  }

  private static getBackupPathByFilename(filename: string): string {
    const tmpFolder = FileHandler.createBackupFile();
    const filePath = path.join(tmpFolder, filename);
    return filePath;
  }

  static saveStringToFile(filename: string, content: string): string {
    const pathToSave = FileHandler.getTmpPathByFilename(filename);
    fs.writeFileSync(pathToSave, content);
    if (configBackup.active) {
      const pathBackupFile = FileHandler.getBackupPathByFilename(filename);
      fs.writeFileSync(pathBackupFile, content);
    }
    return pathToSave;
  }

  static saveArrayBufferToFile(filename: string, content: Buffer): string {
    const pathToSave = FileHandler.getTmpPathByFilename(filename);
    fs.writeFileSync(pathToSave, content);
    if (configBackup.active) {
      const pathBackupFile = FileHandler.getBackupPathByFilename(filename);
      fs.writeFileSync(pathBackupFile, content);
    }
    return pathToSave;
  }

  static deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('error delete file ' + filePath, err);
        }
      });
    }
  }

  static readFile(filePath: string) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
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

  writeFile(filePath: string, content: string) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      fs.writeFileSync(fullPath, content, 'utf8');
      return true;
    }
    catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  appendToFile(filePath: string, content: string) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      fs.appendFileSync(fullPath, content, 'utf8');
      return true;
    }
    catch (error) {
      console.error('Error appending to file:', error);
      return false;
    }
  }

  static readMemory = () => {
    const memoryFilePath = './memory.txt';
    if (!fs.existsSync(memoryFilePath)) {
      fs.writeFileSync(memoryFilePath, '', 'utf8');
    }
    const memoryData = fs.readFileSync(memoryFilePath, 'utf8');
    return memoryData;
  };
}
