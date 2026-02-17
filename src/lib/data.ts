
import matous from "../../public/ja.jpeg";
import mates from "../../public/basak.jpeg";
import jiri from "../../public/2.png";
import roubalka from "../../public/roubalka.jpeg";
import prokop from "../../public/prokop.jpeg";
import { StaticImageData } from "next/image";


export type Event = {
  title: string;
  date: string;
  location: string;
  poster_location?: string; 
};

export const images = [
  "/9.PNG",
  "/1.PNG",
  "/jinin.jpeg",
  "/galeriexx.jpg",
  "/15.jpeg",
  "/jinin2.png",
  "/12.PNG",
  "/houba.jpeg",
  "/14.jpeg",
  "/novosedly.jpeg",
  "/4.PNG",
  "/5.PNG",
  "/hlavacci.jpeg",
  "/7.PNG",
  "/roubalka_deti.jpg",
  "/8.PNG",
  "/11.PNG",
];

export type Member = {name: string,
               role: string,
               bio: string,
               image: StaticImageData
}
export const members: Member [] = [
  {
    name: "Matouš Kovář",
    role: "Sólová kytara",
    bio: "Kapelník, zvukař a tahoun celé kapely. Řídí zkoušky i koncerty, dohlíží na zvuk a zároveň přidává kytarová sóla, která dávají našim vystoupením drive.",
    image: matous,
  },
  {
    name: "Jiří Bártík",
    role: "Rytmická kytara",
    bio: "Rytmická jistota a autor vizuálů kapely. Stará se o plakáty i grafiku, na pódiu přidává kytaru a vlastní nápady, které dodávají koncertům originální náboj.",
    image: jiri,
  },
  {
    name: "Denisa Roubalová",
    role: "Zpěv",
    bio: "Hlavní hlas kapely a královna pódiové energie. Stará se o sociální sítě i vizuální styl kapely a na pódiu kombinuje zpěv s tancem, takže se publikum nikdy nenudí.",
    image: roubalka,
  },
  {
    name: "Matyáš Fojtů",
    role: "Basa",
    bio: "Basák, bavič a moderátor večerů. Jeho rytmus drží kapelu pohromadě a jeho hlášky i improvizace baví publikum stejně jako hudba.",
    image: mates,
  },
  {
    name: "Petr Roubal",
    role: "Bicí",
    bio: "Metronom, který drží pevné tempo a udává energii celé kapele. Kromě bubnů má na starosti i tvorbu setlistů a s Denisou tvoří vokální duo, které dodává koncertům další rozměr.",
    image: prokop,
  },
];


export const events : Event[] = [
  { title: "Soukromá akce", date: "21.3.2026", location: "Horažďovice U Hlaváčků" },
  { title: "Velikonoční Houba", date: "4.4.2026", location: "MC Houba Horažďovice" },
  { title: "Anděl Music Bar", date: "30.5.2026", location: "Plzeň" },
  { title: "Festival Vítání léta", date: "6.6.2026", location: "Malenice" },
  { title: "Svatba", date: "20.6.2026", location: "Nepomuk" },
  { title: "Diskotéka", date: "27.6.2026", location: "České Velenice" },
  { title: "Svatba", date: "8.8.2026", location: "Zahorčice" },
  { title: "Svatba", date: "22.8.2026", location: "Radomyšl",poster_location: "/plakat_houba_velikonoce.png" },
];


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