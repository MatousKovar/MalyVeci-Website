import Image from "next/image"
import {Member} from "@/lib/data"


interface MemberProps extends Member{
    i: number
}

export default function MemberCard({i, name, role,bio,image} : MemberProps)
{
    return (
        <div
            key={i}
            className={`flex mx-10 flex-col overflow-hidden lg:flex-row items-center lg:items-start md:space-x-8 ${
              i % 2 === 0 ? "" : "lg:flex-row-reverse lg:space-x-reverse"
            }`}
          >
            <div className="relative w-38 h-48 sm:w-48 sm:h-48 md:w-64 md:h-64 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={image}
                alt={name}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="mt-4 md:mt-0 text-left md:max-w-xl">
              <h3 className="text-xl font-semibold text-[#D90000] z-10">
                {name}
              </h3>
              <p className="text-gray-300 italic z-10">{role}</p>
              <p className="text-gray-400 mt-2 z-20">{bio}</p>
            </div>
          </div>
    )
}