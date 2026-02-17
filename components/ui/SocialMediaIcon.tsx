

type SocialMediaIconProps = {
    href: string;
    svg: string;
    path: string;
}

export default function SocialMediaIcon({href, svg, path}: SocialMediaIconProps)
{
    return(
        <a
            href={href}
            className="p-2 rounded-lg flex items-center border border-gray-300 justify-center transition-all duration-500 hover:border-gray-100 hover:bg-gray-100"
          >
            <svg
              xmlns={svg}
              width="28"
              height="28"
              viewBox="0 0 71 72"
              fill="none"
            >
              <path
                d={path}
                fill="#D90000"
                fillRule="evenodd"
                clipRule="evenodd" 
              />
            </svg>
          </a>
    )
}