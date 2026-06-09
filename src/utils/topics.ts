// A topic as used within the client UI.
export type Topic = {
  identifier: string; // value sent in the request "topics" field
  interfaces: string[]; // spatial operations the topic supports
};

// Subset of the GA "/topics" response (TopicDefinitionOutsideDto).
export type TopicDefinitionOutside = {
  identifiers: string[];
  supports?: string[];
};

// Map a GA topic definition to the client topic shape. The shortest identifier,
// e.g. "kreis_f" out of ["sn_kreis_f", "kreis_f"]) is used.
export function toTopic(raw: TopicDefinitionOutside): Topic {
  const identifier = [...raw.identifiers].sort(
    (a, b) => a.length - b.length,
  )[0];
  return { identifier, interfaces: raw.supports ?? [] };
}
