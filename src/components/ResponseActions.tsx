import React, { useEffect, useRef, useState } from 'react';

interface ResponseActionsProps {
  text: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  showCopy: boolean;
  showExpand?: boolean;
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const CopyIcon = () => (
  <svg {...iconProps}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg {...iconProps}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ExpandIcon = () => (
  <svg {...iconProps}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const CollapseIcon = () => (
  <svg {...iconProps}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const ResponseActions: React.FC<ResponseActionsProps> = ({
  text,
  expanded,
  onToggleExpanded,
  showCopy,
  showExpand = true,
}) => {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);

  // Escape leaves the full view. Only the instance with the expand button
  // listens, otherwise every instance would toggle.
  useEffect(() => {
    if (!expanded || !showExpand) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggleExpanded();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expanded, showExpand, onToggleExpanded]);

  useEffect(() => {
    return () => {
      window.clearTimeout(copiedTimer.current);
    };
  }, []);

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy response', error);
      return;
    }

    setCopied(true);
    window.clearTimeout(copiedTimer.current);

    copiedTimer.current = window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const copyLabel = copied ? 'Response copied' : 'Copy response';
  const expandLabel = expanded ? 'Exit full view' : 'Full view';

  return (
    <>
      {showCopy && (
        <button
          type="button"
          className={`response-action response-action--copy${copied ? ' is-done' : ''}`}
          onClick={copyResponse}
          disabled={!text}
          aria-label={copyLabel}
          title={copyLabel}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      )}

      {showExpand && (
        <div className="response-actions">
          <button
            type="button"
            className="response-action"
            onClick={onToggleExpanded}
            disabled={!text}
            aria-pressed={expanded}
            aria-label={expandLabel}
            title={expandLabel}
          >
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        </div>
      )}
    </>
  );
};

export default ResponseActions;
