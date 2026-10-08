const VIDEO_ID = /^[\w-]{11}$/;
const PLAYLIST_ID = /^[\w-]{2,}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtube-nocookie.com', 'youtu.be']);
const PATH_VIDEO_ID = /^\/(?:shorts|embed|live|v)\/([\w-]{11})/;

function parseYouTubeUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(?:www|m|music)\./, '');
  return YOUTUBE_HOSTS.has(host) ? url : null;
}

/**
 * Extracts the video ID from a YouTube video URL (watch, youtu.be, shorts, embed, live)
 */
export function parseVideoId(input: string): string | null {
  const url = parseYouTubeUrl(input);
  if (!url) return null;

  let id: string | null | undefined;
  if (url.hostname.endsWith('youtu.be')) {
    id = url.pathname.split('/')[1];
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v');
  } else {
    id = PATH_VIDEO_ID.exec(url.pathname)?.[1];
  }

  return id && VIDEO_ID.test(id) ? id : null;
}

/**
 * Extracts the playlist ID (`list=` parameter) from a YouTube URL
 */
export function parsePlaylistId(input: string): string | null {
  const id = parseYouTubeUrl(input)?.searchParams.get('list');
  return id && PLAYLIST_ID.test(id) ? id : null;
}
