

type SocialMediaIconProps = {
    href: string;
    label: string;
    compact?: boolean;
    svg: string;
    path: string;
}

export default function SocialMediaIcon({href, svg, path, label, compact = false}: SocialMediaIconProps)
{
    return(
        <a
            href={href}
            aria-label={label}
            title={label}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg flex shrink-0 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${compact ? "h-9 w-9 text-stone-300 hover:bg-white/10 hover:text-[#D90000]" : "p-2 border border-gray-300 text-[#D90000] hover:border-gray-100 hover:bg-gray-100"}`}
          >
            <svg
              xmlns={svg}
              aria-hidden="true"
              width={compact ? 24 : 28}
              height={compact ? 24 : 28}
              viewBox="0 0 71 72"
              fill="none"
            >
              <path
                d={path}
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd" 
              />
            </svg>
          </a>
    )
}