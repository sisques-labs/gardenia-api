/**
 * Matches an MQTT topic against a subscription filter, honouring the `+`
 * (single level) and `#` (multi level, trailing) wildcards.
 *
 * The broker already filters what it delivers, but a single connection serves
 * many subscriptions, so the service re-checks each incoming topic to route it
 * to the right handler.
 */
export function topicMatches(filter: string, topic: string): boolean {
  const filterSegments = filter.split('/');
  const topicSegments = topic.split('/');

  for (let i = 0; i < filterSegments.length; i++) {
    const filterSegment = filterSegments[i];

    if (filterSegment === '#') {
      // `#` must be the last segment and matches the remainder (incl. nothing).
      return i === filterSegments.length - 1;
    }

    if (i >= topicSegments.length) {
      return false;
    }

    if (filterSegment !== '+' && filterSegment !== topicSegments[i]) {
      return false;
    }
  }

  return filterSegments.length === topicSegments.length;
}
