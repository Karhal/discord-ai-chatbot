import fs from 'fs';
import path from 'path';
import writeMemoryTool from './tools/write-memory';
import generateImageTool from './tools/generate-image';

const tools: any[] = [];

tools.push(writeMemoryTool);
tools.push(generateImageTool);

const readMemory = () => {
	const memoryFilePath = path.join(__dirname, 'memory.txt');
	if (!fs.existsSync(memoryFilePath)) {
		fs.writeFileSync(memoryFilePath, '', 'utf8');
	}
	const memoryData = fs.readFileSync(memoryFilePath, 'utf8');
	return memoryData;
};

export { tools, readMemory };
