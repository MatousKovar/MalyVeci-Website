import React from "react";
import Image from "next/image";

type PosterModalProps = {
  posterSrc: string | null;  // path to the image, can be null when closed
  onClose: () => void;       // callback when closing
};

export default function PosterModal({ posterSrc, onClose } : PosterModalProps ) {
  if (!posterSrc) return null;

  return (
    //this darkens the background
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"> 
      {/* Dark blue background frame around image */}
      <div className="relative bg-gray-900 p-4 rounded-xl shadow-xl">
        {/* Poster image */}
        <Image
          src={posterSrc}
          alt="Event Poster"
          width={500}
          height={500}
          className="rounded-lg object-contain w-full h-auto"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}