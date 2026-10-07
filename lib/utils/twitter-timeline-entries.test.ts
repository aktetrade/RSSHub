import { describe, expect, it, vi } from 'vitest';

import type * as TwitterUtils from '@/routes/twitter/api/web-api/utils';

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

vi.mock('@/utils/cache', () => ({
    default: {
        tryGet: (key: string, callback: () => Promise<unknown>) => (key.startsWith('twitter-userdata-') ? Promise.resolve({ data: { user: { result: { rest_id: 'account-id' } } } }) : callback()),
        set: vi.fn(),
    },
}));
vi.mock('@/routes/twitter/api/web-api/utils', async (importOriginal) => {
    const original = await importOriginal<typeof TwitterUtils>();
    return { ...original, paginationTweets: vi.fn() };
});

const item = (id: string, author: string) => ({
    entryId: `conversation-item-${id}`,
    item: { itemContent: { tweet_results: { result: { rest_id: id, legacy: { user_id_str: author, full_text: `post ${id}` } } } } },
});

it('includes current profile conversations and excludes posts from other authors in a user timeline', async () => {
    const { default: api } = await import('@/routes/twitter/api/web-api/api');
    const { paginationTweets } = await import('@/routes/twitter/api/web-api/utils');
    vi.mocked(paginationTweets).mockResolvedValue([
        { entryId: 'profile-conversation-latest', content: { items: [item('latest', 'account-id'), item('other-reply', 'other-id')] } },
        { ...item('older', 'account-id'), entryId: 'tweet-older' },
    ]);
    expect(await api.getUserTweets('example')).toEqual([expect.objectContaining({ id_str: 'latest' }), expect.objectContaining({ id_str: 'older' })]);
});
