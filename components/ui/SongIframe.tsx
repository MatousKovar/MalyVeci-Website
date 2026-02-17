type SongIframeProps = { src: string };

export default function SongIframe({ src }: SongIframeProps) {
  return (
    <iframe
      className="rounded-lg shadow-lg"
      width="300"
      src={src}
      height="80"
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    ></iframe>
  );
}
