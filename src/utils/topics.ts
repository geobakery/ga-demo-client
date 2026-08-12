// A topic as used within the client UI.
export type Topic = {
  identifier: string; // value sent in the request "topics" field
  interfaces: string[]; // spatial operations the topic supports
  title?: string; // human readable name
  description?: string; // what the topic contains
};

// Subset of the GA "/topics" response (TopicDefinitionOutsideDto).
export type TopicDefinitionOutside = {
  identifiers: string[];
  supports?: string[];
  title?: string;
  description?: string;
};

// Map a GA topic definition to the client topic shape. The shortest identifier,
// e.g. "kreis_f" out of ["sn_kreis_f", "kreis_f"]) is used.
export function toTopic(raw: TopicDefinitionOutside): Topic {
  const identifier = [...raw.identifiers].sort(
    (a, b) => a.length - b.length,
  )[0];
  return {
    identifier,
    interfaces: raw.supports ?? [],
    title: raw.title,
    description: raw.description,
  };
}

// Tooltip text for a topic: "Title: Description", or whichever part exists.
export function topicTooltip(topic: Topic): string | undefined {
  const parts = [topic.title, topic.description].filter(
    (part): part is string => Boolean(part?.trim()),
  );
  return parts.length > 0 ? parts.join(': ') : undefined;
}
