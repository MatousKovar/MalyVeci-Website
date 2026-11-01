import Image from "next/image";
import type { Member } from "@/lib/data";
import styles from "./MemberCard.module.css";

export default function MemberCard({ name, role, bio, image }: Member) {
  return (
    <article className={styles.card}>
      <div className="relative">
        <Image
          src={image}
          alt={name}
          sizes="(min-width: 768px) 360px, (min-width: 440px) 320px, 82vw"
          className="block h-auto w-full rounded-sm"
        />
        <span className="absolute bottom-0 left-0 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white" style={{ backgroundColor: "rgba(217, 0, 0, 0.65)" }}>
          {role}
        </span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">{name}</h3>
      <p className="mt-3 text-base leading-relaxed text-stone-400">{bio}</p>
    </article>
  );
}
