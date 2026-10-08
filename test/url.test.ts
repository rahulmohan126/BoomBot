import { describe, expect, it } from 'vitest';
import { parsePlaylistId, parseVideoId } from '../src/youtube/url.js';

describe('parseVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  https://youtu.be/dQw4w9WgXcQ  ', 'dQw4w9WgXcQ'],
  ])('parses %s', (input, expected) => {
    expect(parseVideoId(input)).toBe(expected);
  });

  it.each([
    'never gonna give you up',
    'https://example.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/playlist?list=PL1234567890',
  ])('rejects %s', (input) => {
    expect(parseVideoId(input)).toBeNull();
  });
});

describe('parsePlaylistId', () => {
  it('parses list= from playlist and watch URLs', () => {
    expect(parsePlaylistId('https://www.youtube.com/playlist?list=PLabc_123-x')).toBe(
      'PLabc_123-x',
    );
    expect(parsePlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc')).toBe('PLabc');
  });

  it('ignores non-playlist input', () => {
    expect(parsePlaylistId('https://youtu.be/dQw4w9WgXcQ')).toBeNull();
    expect(parsePlaylistId('lofi list=PLabc')).toBeNull();
    expect(parsePlaylistId('https://example.com/?list=PLabc')).toBeNull();
  });
});
