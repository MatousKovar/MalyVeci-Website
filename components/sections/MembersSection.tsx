import { members } from "@/lib/data";
import MemberCard from "../ui/MemberCard";

export default function MembersSection() {
  return (
    <div className="relative z-10 mx-auto max-w-[1320px] px-10 pb-12">
        <div className="grid grid-cols-6 gap-x-8 gap-y-12 border-t border-white/15 pt-9">
          {members.map((member, i) => (
            <MemberCard key={member.name} i={i} {...member} />
          ))}
        </div>
    </div>
  );
}
