"use client";
import { useState } from "react";

interface VideoProps {
  videoId?: string;
  videoPath?: string;
  title?: string;
}

export function Video({ videoId, videoPath, title }: VideoProps) {
  const [playVideo, setPlayVideo] = useState(false);

  // Determina se é um vídeo do YouTube ou local
  const isYouTube = videoId && !videoPath;
  
  return (
    <div className="relative w-full h-[500px] overflow-hidden lg:mb-10 rounded-2xl bg-gradient-to-tr from-purple-400 to-indigo-700 cursor-pointer">
      {!playVideo && (
        <button
          onClick={() => setPlayVideo(true)}
          className="absolute inset-auto w-16 h-16 text-white transform -translate-x-1/2 -translate-y-1/2 lg:w-28 lg:h-28 top-1/2 left-1/2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 lg:w-28 lg:h-28"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="sr-only">Play Video</span>
        </button>
      )}
      {playVideo && (
        <>
          {isYouTube ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            ></iframe>
          ) : (
            <video
              src={videoPath}
              controls
              autoPlay
              className="w-full h-full object-cover"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </>
      )}
      {title && <div className="absolute bottom-4 left-4 text-white font-medium px-3 py-1 bg-black/50 rounded-lg">{title}</div>}
    </div>
  );
}

export default Video;