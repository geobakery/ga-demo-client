import {
  INTERFACE_DEFAULTS,
  type InterfaceName,
  type RequestParameters,
} from '../config/config';
import type { Topic } from './topics';

// UI state derived from an interface switch.
export type InterfaceSelection = {
  parameterValues: RequestParameters;
  returnGeometry: boolean;
  selectedTopics: string[];
};

// Topics supported by the interface.
export function topicsForInterface(
  interfaceName: InterfaceName,
  topics: Topic[],
): Topic[] {
  return topics.filter((topic) => topic.interfaces.includes(interfaceName));
}

// Apply an interface switch: reset parameters to the interface defaults and
// remove unsupported topics.
export function selectInterface(
  interfaceName: InterfaceName,
  topics: Topic[],
  selectedTopics: string[],
): InterfaceSelection {
  const defaults = INTERFACE_DEFAULTS[interfaceName];
  const supported = topicsForInterface(interfaceName, topics).map(
    (topic) => topic.identifier,
  );

  return {
    // Copy so that state updates never alias the shared config object.
    parameterValues: { ...defaults.parameters },
    returnGeometry: defaults.returnGeometry,
    selectedTopics: selectedTopics.filter((topic) => supported.includes(topic)),
  };
}
