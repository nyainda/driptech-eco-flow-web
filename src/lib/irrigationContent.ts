const IRRIGATION_RELEVANCE = /\b(?:irrigat\w*|drip(?:\s?lines?|\s?tape)?|sprinkler\w*|fertigat\w*|water\s+(?:pump\w*|stor\w*|supply|manag\w*|filtrat\w*|distribution)|pump\w*|filtrat\w*|filter\w*|greenhouse\w*|orchard\w*|borehole|micro-?irrigat\w*)\b/i;

/**
 * Keep public project examples relevant to DripTech's irrigation business.
 * Product, project and story records can also be used by other internal tools;
 * this predicate only controls which records are presented as public examples.
 */
export function isIrrigationRelatedContent(...fields: unknown[]): boolean {
  const searchableText = fields
    .filter((field): field is string => typeof field === "string")
    .map((field) => field.trim())
    .filter(Boolean)
    .join(" ");

  return IRRIGATION_RELEVANCE.test(searchableText);
}
