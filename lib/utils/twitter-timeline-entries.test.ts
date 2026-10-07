import { describe, expect, it } from 'vitest';

import { collectTimelineEntries } from './twitter-timeline-entries';

describe('Twitter timeline instruction coverage', () => {
    it('preserves ordinary latest posts when a response also has older thread module items', () => {
        expect(
            collectTimelineEntries([
                { type: 'TimelineAddEntries', entries: [{ entryId: 'tweet-latest' }, { entryId: 'tweet-next' }] },
                { type: 'TimelineAddToModule', moduleItems: [{ entryId: 'tweet-older-thread' }] },
            ]).map((entry) => entry.entryId)
        ).toEqual(['tweet-latest', 'tweet-next', 'tweet-older-thread']);
    });
    it('collects every add instruction, flattens grids and deduplicates identities', () => {
        expect(
            collectTimelineEntries([
                { type: 'TimelineAddEntries', entries: [{ entryId: 'tweet-a' }] },
                { type: 'TimelineAddEntries', entries: [{ entryId: 'tweet-b' }, { entryId: 'profile-grid-0', content: { items: [{ entryId: 'tweet-grid' }] } }] },
                { type: 'TimelineAddToModule', moduleItems: [{ entryId: 'tweet-a' }, { entryId: 'tweet-c' }] },
                { type: 'TimelineAddToModule', moduleItems: [{ entryId: 'tweet-d' }] },
            ]).map((entry) => entry.entryId)
        ).toEqual(['tweet-a', 'tweet-b', 'profile-grid-0', 'tweet-c', 'tweet-d', 'tweet-grid']);
    });
    it('handles absent, empty and unrelated instructions without an entries.find crash', () => {
        expect(collectTimelineEntries()).toEqual([]);
        expect(collectTimelineEntries([{ type: 'TimelineAddEntries' }, { type: 'TimelineTerminateTimeline' }])).toEqual([]);
    });
});
