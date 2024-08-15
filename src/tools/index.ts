import AbstractTool from './absract-tool';
import BraveSearchTool from './brave-search-tool';
import CryptoPriceTool from './crypto-price-tool';
import DuneTool from './dune-tool';
import GoogleLighthouseTool from './google-lighthouse-tool';
import GoogleSearchTool from './google-search-tool';
import ImageGeneratorTool from './image-generator-tool';
import MapSearchTool from './map-search-tool';
import SerpSearchTool from './serp-search-tool';
import WriteMemoryTool from './write-memory-tool';

const toolList: (typeof AbstractTool)[] = [
  WriteMemoryTool,
  ImageGeneratorTool,
  BraveSearchTool,
  DuneTool,
  GoogleSearchTool,
  MapSearchTool,
  CryptoPriceTool,
  SerpSearchTool,
  GoogleLighthouseTool
];

export default toolList;
