/* eslint-disable no-undef */
import FileHandler from '../../src/handlers/file-handler';
import fs from 'fs';
import path from 'path';

jest.mock('fs');

describe('FileHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create a folder if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');

      const folderName = 'testFolder';
      const result = FileHandler.createFolder(folderName);

      expect(mkdirSyncSpy).toHaveBeenCalledWith(path.join('.', folderName));
      expect(result).toBe(path.join('.', folderName));
    });

    it('should not create a folder if it already exists', () => {
      fs.existsSync.mockReturnValue(true);
      const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');

      const folderName = 'testFolder';
      const result = FileHandler.createFolder(folderName);

      expect(mkdirSyncSpy).not.toHaveBeenCalled();
      expect(result).toBe(path.join('.', folderName));
    });
  });

  describe('emptyFolder', () => {
    it('should empty the folder if it exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt']);
      const unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync');

      const folderName = 'testFolder';
      FileHandler.emptyFolder(folderName);

      expect(unlinkSyncSpy).toHaveBeenCalledTimes(2);
      expect(unlinkSyncSpy).toHaveBeenCalledWith(path.join('.', folderName, 'file1.txt'));
      expect(unlinkSyncSpy).toHaveBeenCalledWith(path.join('.', folderName, 'file2.txt'));
    });

    it('should do nothing if the folder does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const readdirSyncSpy = jest.spyOn(fs, 'readdirSync');

      const folderName = 'testFolder';
      FileHandler.emptyFolder(folderName);

      expect(readdirSyncSpy).not.toHaveBeenCalled();
    });
  });

  describe('getFolderFilenameFullPaths', () => {
    it('should return full paths of filenames in the folder', () => {
      fs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt']);

      const folderPath = 'testFolder';
      const result = FileHandler.getFolderFilenameFullPaths(folderPath);

      expect(result).toEqual([path.join('.', folderPath, 'file1.txt'), path.join('.', folderPath, 'file2.txt')]);
    });
  });

  describe('saveStringToFile', () => {
    it('should save string content to a file', () => {
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');
      const folder = 'testFolder';
      const filename = 'testFile.txt';
      const content = 'Hello, World!';

      const result = FileHandler.saveStringToFile(folder, filename, content);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(path.join(folder, filename), content);
      expect(result).toBe(path.join(folder, filename));
    });
  });

  describe('saveArrayBufferToFile', () => {
    it('should save array buffer content to a file', () => {
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');
      const folder = 'testFolder';
      const filename = 'testFile.txt';
      const content = Buffer.from('Hello, World!');

      const result = FileHandler.saveArrayBufferToFile(folder, filename, content);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(path.join(folder, filename), content);
      expect(result).toBe(path.join(folder, filename));
    });
  });

  describe('readFile', () => {
    it('should read file content if the file exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('File content');

      const fileHandler = new FileHandler();
      const baseDir = './tmp_test';
      const filePath = 'testFile.txt';
      const result = fileHandler.readFile(baseDir, filePath);

      expect(result).toBe('File content');
    });

    it('should return null if the file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const fileHandler = new FileHandler();
      const baseDir = './tmp_test';
      const filePath = 'testFile.txt';
      const result = fileHandler.readFile(baseDir, filePath);

      expect(result).toBeNull();
    });
  });

  describe('writeFile', () => {
    it('should write content to a file', () => {
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

      const fileHandler = new FileHandler();
      const baseDir = './tmp_test';
      const filePath = 'testFile.txt';
      const content = 'File content';
      const result = fileHandler.writeFile(baseDir, filePath, content);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(path.join(baseDir, filePath), content, 'utf8');
      expect(result).toBe(true);
    });

    it('should return false if an error occurs', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Error writing file');
      });

      const fileHandler = new FileHandler();
      const baseDir = './tmp_test';
      const filePath = 'testFile.txt';
      const content = 'File content';
      const result = fileHandler.writeFile(baseDir, filePath, content);

      expect(result).toBe(false);
    });
  });

  describe('appendToFile', () => {
    it('should append content to a file', () => {
      const appendFileSyncSpy = jest.spyOn(fs, 'appendFileSync');

      const fileHandler = new FileHandler();
      const baseDir = './tmp_test';
      const filePath = 'testFile.txt';
      const content = 'File content';
      const result = fileHandler.appendToFile(baseDir, filePath, content);

      expect(appendFileSyncSpy).toHaveBeenCalledWith(path.join(baseDir, filePath), content, 'utf8');
      expect(result).toBe(true);
    });

    it('should return false if an error occurs', () => {
      fs.appendFileSync.mockImplementation(() => {
        throw new Error('Error appending to file');
      });

      const fileHandler = new FileHandler();
      const baseDir = './tmp_test';
      const filePath = 'testFile.txt';
      const content = 'File content';
      const result = fileHandler.appendToFile(baseDir, filePath, content);

      expect(result).toBe(false);
    });
  });
});
