/** Converts a youtube.com/watch or youtu.be link into its /embed/ form, or null if it isn't one. */
export function youtubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}
