export type Event = {
  title: string;
  date: string;
  location: string;
  posterPath?: string;
  description?: string;
};

export type ManagedEvent = Event & {
  id: string;
};
