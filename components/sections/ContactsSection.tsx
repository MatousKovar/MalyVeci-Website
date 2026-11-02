import ContactCard from "../ui/ContactCard"
import SocialLinks from "../ui/SocialLinks";

export default function ContactsSection() {
  return (
    <section id="Kontakty" className=" relative py-20 text-stone-300">
      <h2 className="text-5xl text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl ">
        <span className="text-black">KO</span>
        <span className="text-[#D90000]">NTAKTY</span>
      </h2>
      <div className="max-w-5xl mx-auto text-center px-4">
        <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
        <ContactCard title="Telefon" value="+420 774 236 616"/>
        <ContactCard title="Email" value="malyveci.band@gmail.com"/>  
        </div>
        <div className=" w-full h-auto py-8 flex items-center justify-center gap-2 flex-wrap">
          <SocialLinks />
        </div>
      </div>
    </section>
  );
}
