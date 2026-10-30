
import matous from "../../public/matous-preview.jpeg";
import mates from "../../public/mates.jpeg";
import jiri from "../../public/jirka.jpeg";
import roubalka from "../../public/denca.jpeg";
import prokop from "../../public/peta.jpeg";
import { StaticImageData } from "next/image";



export type Member = {name: string,
               role: string,
               bio: string,
               image: StaticImageData
}
export const members: Member [] = [
  {
      name: "Denisa Roubalová",
      role: "Zpěv",
      bio: "Hlavní hlas kapely a královna pódia. Stará se o sociální sítě i vizuální styl kapely.",
      image: roubalka,
  },
  {
    name: "Matouš Kovář",
    role: "Sólová kytara",
    bio: "Kapelník, zvukař a tahoun celé kapely. Řídí zkoušky i koncerty, dohlíží na zvuk v kapele hraje na kytaru a zpívá.",
    image: matous,
  },
  {
    name: "Jiří Bártík",
    role: "Rytmická kytara",
    bio: "Rytmický kytarista a zpěvák, který kromě hraní zvládne udělat i originální plakáty.",
    image: jiri,
  },
  {
    name: "Matyáš Fojtů",
    role: "Basa",
    bio: "Basák, bavič a moderátor večerů. bez jeho vtipů bychom se na cestách nudili.",
    image: mates,
  },
  {
    name: "Petr Roubal",
    role: "Bicí",
    bio: "Metronom, který drží pevné tempo celé kapele. Kromě bubnů má na starosti i tvorbu setlistů a je vrchním autobusákem kapely.",
    image: prokop,
  },
];



export type { Event } from "@/lib/events";

export const spotifyTracks = [
  "https://open.spotify.com/embed/track/6wnc03soJZURZVtyAbK81X?utm_source=generator",
  "https://open.spotify.com/embed/track/5qYKPSKeZb83S0kFskJkPJ?utm_source=generator",
  "https://open.spotify.com/embed/track/7yy1E4CAVun8vq75NMQ6FD?utm_source=generator",
  "https://open.spotify.com/embed/track/6WfhZNzOioBmDUq4xb5kvz?utm_source=generator",
  "https://open.spotify.com/embed/track/3r6AJfqJ44FepL26lwLMPf?utm_source=generator",
  "https://open.spotify.com/embed/track/2IJftBfq7pJ43tfnOR0RB3?utm_source=generator",
  "https://open.spotify.com/embed/track/15tHagkk8z306XkyOHqiip?utm_source=generator",
  "https://open.spotify.com/embed/track/5vfjUAhefN7IjHbTvVCT4Z?utm_source=generator",
  "https://open.spotify.com/embed/track/273GBYX8ZWhlILVTWvQrS5?utm_source=generator",
  "https://open.spotify.com/embed/track/3k2mJZM0fdqDmW7GUbq2zs?utm_source=generator",
  "https://open.spotify.com/embed/track/29uKzagduhFDTWPCjqaGOg?utm_source=generator",
  "https://open.spotify.com/embed/track/4yKFAIgwISeVWcNnatlxx3?utm_source=generator",
  "https://open.spotify.com/embed/track/0jWgAnTrNZmOGmqgvHhZEm?utm_source=generator",
  "https://open.spotify.com/embed/track/2SiXAy7TuUkycRVbbWDEpo?utm_source=generator",
  "https://open.spotify.com/embed/track/0rmGAIH9LNJewFw7nKzZnc?utm_source=generator",
  "https://open.spotify.com/embed/track/4TIJ7zSBNejpoIPaWpWRKc?utm_source=generator",
  "https://open.spotify.com/embed/track/3SFXsFpeGmBTtQvKiwYMDA?utm_source=generator",
  "https://open.spotify.com/embed/track/36ypxavzIpdQffwmUboUCP?utm_source=generator",
  "https://open.spotify.com/embed/track/6K4r3XENOKeXFTKlBlAJLC?utm_source=generator",
];
