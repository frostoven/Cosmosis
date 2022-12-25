import CosmosisPlugin from '../../types/CosmosisPlugin';

class Template {
  constructor() {
    throw 'Use this class as plugin boilerplate.';
  }
}

const templatePlugin = new CosmosisPlugin('template', Template);

export {
  Template,
  templatePlugin,
}
