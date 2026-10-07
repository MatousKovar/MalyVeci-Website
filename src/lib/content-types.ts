export type EventContent = {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  posterPath?: string;
};

export type ShortContent = {
  id: string;
  videoId: string;
  order: number;
};

export type GalleryPhotoContent = {
  id: string;
  src: string;
  order: number;
  width: number;
  height: number;
};
