
import matous from "../../public/ja.jpeg";
import mates from "../../public/basak.jpeg";
import jiri from "../../public/2.png";
import roubalka from "../../public/roubalka.jpeg";
import prokop from "../../public/prokop.jpeg";


export type Event = {
  title: string;
  date: string;
  location: string;
  poster_location?: string; 
};

export const images = [
  "/12.PNG",
  "/1.PNG",
  "/jinin.jpeg",
  "/galeriexx.jpg",
  "/9.PNG",
  "/15.jpeg",
  "/jinin2.png",
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

export const members = [
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
  { title: "Anděl Music Bar", date: "30.5.2026", location: "Plzeň" },
  { title: "Festival Vítání léta", date: "6.6.2026", location: "Malenice" },
  { title: "Svatba", date: "20.6.2026", location: "Strakonice" },
  { title: "Diskotéka", date: "27.6.2026", location: "České Velenice" },
  { title: "Svatba", date: "8.8.2026", location: "Sušice" },
  { title: "Svatba", date: "8.8.2026", location: "Sušice", poster_location: "/4.PNG" },
];