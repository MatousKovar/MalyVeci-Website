import Image from "next/image";
import type { Member } from "@/lib/data";

interface MemberProps extends Member {
  i: number;
}

export default function MemberCard({ i, name, role, bio, image }: MemberProps) {
  return (
    <article className={`col-span-2 min-w-0 ${i === 3 ? "col-start-2" : ""}`}>
      <div className="relative">
        <Image
          src={image}
          alt={name}
          sizes="(min-width: 1320px) 392px, calc((100vw - 144px) / 3)"
          className="block h-auto w-full rounded-sm"
        />
        <span className="absolute bottom-0 left-0 bg-[#d90000] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white">
          {role}
        </span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">{name}</h3>
      <p className="mt-3 text-base leading-relaxed text-stone-400">{bio}</p>
    </article>
  );
}
