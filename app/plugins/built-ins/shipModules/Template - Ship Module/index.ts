import CosmosisPlugin from '../../../types/CosmosisPlugin';
import Template from './types/Template';
import ModuleSpawner from '../types/ModuleSpawner';

class TemplateModule extends ModuleSpawner {
  createPart() {
    return new Template();
  }
}

const templateModulePlugin = new CosmosisPlugin('templateModule', TemplateModule);

export {
  TemplateModule,
  templateModulePlugin,
}
