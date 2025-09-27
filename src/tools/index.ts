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
import StableDiffusionTool from './stablediffusion-tool';
import GiphyTool from './giphy-tool';
import YoutubeTranscriptTool from './youtube-transcript-tool';
import TradingChartTool from './trading-chart-tool';
const toolList: (typeof AbstractTool)[] = [
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
  YoutubeTranscriptTool,
  TradingChartTool
];

export default toolList;
