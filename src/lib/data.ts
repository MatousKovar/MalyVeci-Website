
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
