import fs from "fs";
import path from "path";

export default class FileHandler {
  baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  readFile(filePath: string) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      const data = fs.readFileSync(fullPath, "utf8");
      return data;
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  }

  writeFile(filePath: string, content: string) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      fs.writeFileSync(fullPath, content, "utf8");
      return true;
    } catch (error) {
      console.error("Error writing file:", error);
      return false;
    }
  }

  appendToFile(filePath: string, content: string) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      fs.appendFileSync(fullPath, content, "utf8");
      return true;
    } catch (error) {
      console.error("Error appending to file:", error);
      return false;
    }
  }
}
