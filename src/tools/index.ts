import AbstractTool from './absract-tool';
import BraveSearchTool from './brave-search-tool';
import CryptoPriceTool from './crypto-price-tool';
import DuneTool from './dune-tool';
import FluxGeneratorTool from './flux-generator-tool';
import GoogleLighthouseTool from './google-lighthouse-tool';
import GoogleSearchTool from './google-search-tool';
import DallETool from './dalle-tool';
import MapSearchTool from './map-search-tool';
import SerpSearchTool from './serp-search-tool';
import WriteMemoryTool from './write-memory-tool';
import StableDiffusionTool from './stablediffusion-tool';
import GiphyTool from './giphy-tool';
import ImageToVideoTool from './image-to-video-tool';

const toolList: (typeof AbstractTool)[] = [
  WriteMemoryTool,
  DallETool,
  BraveSearchTool,
  DuneTool,
  GiphyTool,
  GoogleSearchTool,
  MapSearchTool,
  CryptoPriceTool,
  SerpSearchTool,
  GoogleLighthouseTool,
  FluxGeneratorTool,
  StableDiffusionTool,
  ImageToVideoTool
];

export default toolList;
