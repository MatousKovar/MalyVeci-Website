import Image from "next/image";
import { members } from "@/lib/data"; // importing data
import MemberCard from "../ui/MemberCard";



export default function ONasSection() {
  return (
    <section id="onas" className="py-20 bg-black text-white mt-20 z-10">
      <h2
        className="text-stroke-2 text-5xl font-bold font-orbitron text-center mb-12 
              sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl"
      >
        <span className="text-black brightness-85">O </span>
        <span className="text-[#D90000] brightness-85">KAPELE</span>
      </h2>
      <div className=" flex text-md md:mx-45 mx-10 sm:my-16 grid sm:grid-cols-1 md:grid-cols-2 gap-4 mb-30 z-10 text-center">
        {/* <p className=" text-center mx-auto max-w-140  leading-relaxed text-gray-100 px-4 py-4 rounded-lg shadow-lg z-10"> */}
        <div className=" text-left text-stone-300 mx-auto max-w-140  leading-relaxed text-gray-100 px-4 py-4 rounded-lg shadow-lg z-10">
          <p className="mb-3">Jsme Malý Věci! Trochu jiná zábavová kapela.</p>
          <p className="mb-3">
            Naše pětičlenná parta vznikla v roce 2024 ve Strakonicích původně
            jako způsob, jak trávit volný čas s nástroji v ruce. Brzy nás ale
            začalo lákat hrát i pro lidi – a tak jsme už během prvního roku
            existence odehráli 19 akcí, mezi nimi dva firemní večírky, dvě
            svatby a ještě k tomu zvládli i státnice.
          </p>
          <p className="text-[#D90000] text-lg mb-3">
            <strong>Řídime se dvěma hlavními motty:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-3">
            <li>
              <strong>Pestrý repertoár</strong> – chceme, aby si na své přišli
              mladší, starší, rockovější i popovější posluchači. Proto hrajeme
              co nejvíce různých žánrů – od Katy Perry přes Kabáty až po Bon
              Jovi.
            </li>
            <li>
              <strong>Hudba nás musí bavit</strong> - pokud hudba baví kapelu,
              tak to baví i lidi. Naší hlavní motivací je láska k hudbě, kterou
              často dáváme najevo jak pohybem, tak zapálením při hraní.
            </li>
          </ul>

          <p className="mb-3">
            Jsme technicky vybavená kapela, vlastníme jak ozvučovací soustavu,
            tak základní osvětlení, takže váš parket nebude nikdy vypadat nudně.
            Zkrátka zníme i vypadáme profesionálně.
          </p>
        </div>
        {/* </p> */}
        <div className=" text-left text-stone-300 mx-auto max-w-140  leading-relaxed text-gray-100 px-4 py-4 rounded-lg shadow-lg z-10">
          <p className="mb-3">
            Po domluvě jsme schopni doplnit naše vystoupení i o DJ a náš
            kytarista se postará i o plakát, který nebude jen obyčejnou
            pozvánkou, ale skutečně upoutá.
          </p>
          <p className="mb-3 text-lg">
            {" "}
            <strong className="text-[#D90000]">
              Proč si vybrat kapelu Malý Věci?
            </strong>
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Pestrý repertoár pro všechny generace</strong> - náš
              aktuální repertoár čítá přes 90 kousků napříč žánry a etapami
              populární hudby. Chcete rockový koncert, retro party ve stylu 80.
              let nebo jen prostě klasickou tancovačku se skladbami, které znáte
              a milujete? Pak jsme ti praví.
            </li>
            <li>
              <strong>Jsme mladá krev</strong> - naše vystoupení je stejně tak o
              hudbě jako o energii a atmosféře, když hrajeme, tak prostě
              nevydržíme stát na místě.
            </li>
            <li>
              <strong>Levnější než konkurence</strong> - hudba pro nás nikdy
              nebyla o penězích, proto vyjdeme vstříc i pořadatelům menších
              akcí.{" "}
            </li>
            <li>
              <strong>Ctíme originál</strong> - Oproti většině zábavových kapel
              se snažíme přiblížit se co nejvíce originálním nahrávkám. U nás to
              není jen o tom zahrát pár akordů a zazpívat stejná slova.{" "}
            </li>
          </ul>
        </div>
      </div>
      <div className="relative max-w-5xl mx-auto space-y-16 px-4 z-10">
        {members.map((member, i) => (
          <MemberCard key={i} i={i} {...member}/>
        ))}
      </div>
    </section>
  );
}
