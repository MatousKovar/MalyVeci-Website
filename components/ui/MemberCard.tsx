import Image from "next/image";
import { Member } from "@/lib/data";

interface MemberProps extends Member {
  i: number;
}

export default function MemberCard({ name, role, bio, image }: MemberProps) {
  return (
    <article
      className="
        snap-center shrink-0
        w-full
        flex flex-col
        rounded-2xl overflow-hidden
        bg-white/[0.04] border border-white/10
        backdrop-blur-sm
      "
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 92vw, 520px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-4 left-5 right-5">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#D90000] font-semibold mb-1.5">
            {role}
          </p>
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
            {name}
          </h3>
        </div>
      </div>
      <p className="px-5 py-5 text-sm leading-relaxed text-stone-300">{bio}</p>
    </article>
  );
}
