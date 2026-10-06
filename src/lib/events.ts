export type Event = {
  title: string;
  date: string;
  location: string;
  poster_location?: string;
  description?: string;
};

export type ManagedEvent = Event & {
  id: string;
};
