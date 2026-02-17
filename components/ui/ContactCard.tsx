

type ContactCardProps = {title:string;
                         value: string;};


export default function ContactCard( {title, value}: ContactCardProps)
{
    return(
        <div className="bg-stone-800/70 p-6 rounded-xl shadow-lg text-center hover:scale-105">
            <p className="text-sm uppercase text-gray-400">{title}</p>
            <a
              className="text-[#D90000] text-lg font-semibold hover:underline"
            >
              {value}
            </a>
          </div>
    )
}