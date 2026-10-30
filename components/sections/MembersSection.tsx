import { members } from "@/lib/data";
import MemberCard from "../ui/MemberCard";
import styles from "./MembersSection.module.css";

export default function MembersSection() {
  return (
    <div className={styles.members}>
      <div
        role="region"
        aria-label="Členové kapely"
        tabIndex={0}
        className={styles.track}
      >
        {members.map((member) => (
          <MemberCard key={member.name} {...member} />
        ))}
      </div>
    </div>
  );
}
