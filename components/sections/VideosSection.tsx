export default function VideosSection() {
  return (
    <section
      id="Videa"
      className="relative py-20 text-white flex flex-col items-center"
    >
      <h2 className="text-5xl mx-10 text-stroke-2 brightness-85 font-bold font-orbitron text-center mb-12 sm:text-6xl md:text-7xl md:text-stroke-4 lg:text-8xl">
        <span className="text-black">PO</span>
        <span className="text-[#D90000]">SLECHNI SI NÁS</span>
      </h2>
      <p className="mb-15 text-center text-xl px-10 text-stone-300">
        Mnoho ukázek našeho hraní naleznete na našem
        <a
          className="font-bold text-stone-400 transition-colors duration-300 ease-in-out hover:text-[#D90000]"
          href="https://www.instagram.com/maly.veci.official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
        >
          {" "}
          Instagramu{" "}
        </a>{" "}
        a také na
        <a
          className="font-bold text-stone-400 transition-colors duration-300 ease-in-out hover:text-[#D90000]"
          href="https://www.youtube.com/@Mal%C3%BDV%C4%9BciOfficial/videos"
        >
          {" "}
          YouTube
        </a>
        .
      </p>

      <div className="w-full max-w-3xl aspect-video">
        <iframe
          className="w-full h-full rounded-xl"
          src="https://www.youtube.com/embed/YCcMVXeO7a4?si=nwcPU8qz7tMOfBN6"
          title="Koncert Spinavy zada kapela"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
}
