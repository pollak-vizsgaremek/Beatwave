const HASHTAG_SPLIT_REGEX = /\s+/;
const HASHTAG_WITH_SEPARATORS_REGEX = /(\s+)/;

export const normalizeHashtagInput = (value: string): string =>
  value
    .split(HASHTAG_WITH_SEPARATORS_REGEX)
    .map((part) => {
      if (!part || HASHTAG_SPLIT_REGEX.test(part)) {
        return part;
      }

      return part.startsWith("#") ? part : `#${part}`;
    })
    .join("");

export const getNormalizedHashtags = (value: string): string[] =>
  value
    .split(HASHTAG_SPLIT_REGEX)
    .filter(Boolean)
    .map((text) => (text.startsWith("#") ? text : `#${text}`))
    .map((text) => text.toLowerCase());
