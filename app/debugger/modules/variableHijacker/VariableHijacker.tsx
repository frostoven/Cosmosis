import React from 'react';
import PropTypes from 'prop-types';
import { Accordion, AccordionContent, Icon } from 'semantic-ui-react';
import Hijacker from './Hijacker';

// TODO:
//  Structure:
//  * > Plugin interrogation [with intelligent parsing]
//  * > Hook builder [manual path exec, basically. maybe separate object and key]
//  * > External hooks [vars that prod code injects straight into var hacker]

export default class VariableHijacker extends React.Component<{ rootUtils }> {
  static propTypes = { rootUtils: PropTypes.any };

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
        <Accordion /*fluid styled*/>
          <Accordion.Title
            active={active === 0}
            index={0}
            onClick={this.expandPluginInterrogation}
          >
            <Icon name="dropdown"/>
            Plugin interrogation
          </Accordion.Title>
          <AccordionContent active={active === 0}>
            [Plugin interrogation section TBD]
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
            [Hook builder section TBD]
          </AccordionContent>

          <Accordion.Title
            active={active === 2}
            index={2}
            onClick={this.expandPluginInterrogation}
          >
            <Icon name="dropdown"/>
            External hooks
          </Accordion.Title>
          <AccordionContent active={active === 2}>
            [External hooks section TBD]
          </AccordionContent>
        </Accordion>
      </div>
    );
  }
}
