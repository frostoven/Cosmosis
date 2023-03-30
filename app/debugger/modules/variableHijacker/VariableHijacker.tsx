import React from 'react';
import { Accordion, AccordionContent, Icon } from 'semantic-ui-react';
import { CosmDbgRootUtils } from '../../components/interfaces/CosmDbgRootUtils';
import PluginInterrogator from './components/PluginInterrogator';
import HookChooser from './hookBuilder/HookChooser';

interface RootUtils extends CosmDbgRootUtils {
  rootState: {
    varHackActiveSection: number,
  }
}

export default class VariableHijacker extends React.Component<{ rootUtils: RootUtils }> {
  expandPluginInterrogation = (event, titleProps) => {
    const { index } = titleProps;
    const active = this.props.rootUtils.rootState.varHackActiveSection;
    const newIndex = active === index ? -1 : index;
    this.props.rootUtils.setPersistentState({ varHackActiveSection: newIndex });
  };

  render() {
    let active = this.props.rootUtils.rootState.varHackActiveSection;
    if (typeof active === 'undefined') {
      active = -1;
    }

    return (
      <div>
        <Accordion fluid styled>
          <Accordion.Title
            active={active === 0}
            index={0}
            onClick={this.expandPluginInterrogation}
          >
            <Icon name="dropdown"/>
            Plugin interrogation
            {/*&nbsp;*/}
            {/*<Popup*/}
            {/*  content='Detects plugins and offers means to override their values.'*/}
            {/*  trigger={<Icon name="question circle"/>}*/}
            {/*/>*/}
          </Accordion.Title>
          <AccordionContent active={active === 0}>
            {/* @ts-ignore */}
            <PluginInterrogator rootUtils={this.props.rootUtils}/>
          </AccordionContent>

          <Accordion.Title
            active={active === 1}
            index={1}
            onClick={this.expandPluginInterrogation}
          >
            <Icon name="dropdown"/>
            Hook builder
          </Accordion.Title>
          <AccordionContent active={active === 1}>
            <HookChooser rootUtils={this.props.rootUtils}/>
          </AccordionContent>

          {/* TODO: implement this. This would basically work by feeding the
               PluginInterrogator an arbitrary object. The PluginInterrogator
               is currently hardcoded to work with gameRuntime, and would need
               to be altered to accept parameters generically.
          */}
          {/*<Accordion.Title*/}
          {/*  active={active === 2}*/}
          {/*  index={2}*/}
          {/*  onClick={this.expandPluginInterrogation}*/}
          {/*>*/}
          {/*  <Icon name="dropdown"/>*/}
          {/*  External hooks*/}
          {/*</Accordion.Title>*/}
          {/*<AccordionContent active={active === 2}>*/}
          {/*  [External hooks section TBD]*/}
          {/*</AccordionContent>*/}
        </Accordion>
      </div>
    );
  }
}
