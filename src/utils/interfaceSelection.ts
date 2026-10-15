import {
  INTERFACE_DEFAULTS,
  INTERFACE_PARAMETER_MAPPING,
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

// UI state of the interface that is being left.
export type PreviousSelection = {
  interfaceName: InterfaceName;
  parameterValues: RequestParameters;
  returnGeometry: boolean;
};

// Topics supported by the interface.
export function topicsForInterface(
  interfaceName: InterfaceName,
  topics: Topic[],
): Topic[] {
  return topics.filter((topic) => topic.interfaces.includes(interfaceName));
}

// Apply an interface switch: reset parameters to the interface defaults and
// remove unsupported topics. Parameters supported by both the previous and the
// new interface keep their current value.
export function selectInterface(
  interfaceName: InterfaceName,
  topics: Topic[],
  selectedTopics: string[],
  previous?: PreviousSelection,
): InterfaceSelection {
  const defaults = INTERFACE_DEFAULTS[interfaceName];
  const supported = topicsForInterface(interfaceName, topics).map(
    (topic) => topic.identifier,
  );

  // Copy so that state updates never alias the shared config object.
  const parameterValues: RequestParameters = { ...defaults.parameters };
  let returnGeometry = defaults.returnGeometry;

  if (previous) {
    const previousParameters =
      INTERFACE_PARAMETER_MAPPING[previous.interfaceName];
    const sharedParameters = INTERFACE_PARAMETER_MAPPING[interfaceName].filter(
      (parameter) => previousParameters.includes(parameter),
    );

    for (const parameter of sharedParameters) {
      if (parameter === 'returnGeometry') {
        returnGeometry = previous.returnGeometry;
      } else if (previous.parameterValues[parameter] !== undefined) {
        Object.assign(parameterValues, {
          [parameter]: previous.parameterValues[parameter],
        });
      }
    }
  }

  return {
    parameterValues,
    returnGeometry,
    selectedTopics: selectedTopics.filter((topic) => supported.includes(topic)),
  };
}
