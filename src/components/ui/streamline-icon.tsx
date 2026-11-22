import React from "react";
import {
  BookOpen,
  HandHeart,
  HeartHandshake,
  MessageCircleCheck,
  MessagesSquare,
  Scale,
  ShieldAlert,
} from "lucide-react";

const STREAMLINE_ICON_FILES: Record<string, string> = {
  "heart-handshake": "/icons/streamline/Heart--Streamline-Flex.svg",
  "shield-alert": "/icons/streamline/Shield-1--Streamline-Flex.svg",
  "messages-square": "/icons/streamline/Chat-Bubble-Typing-Oval--Streamline-Flex.svg",
  "message-circle-check": "/icons/streamline/Discussion-Converstion-Reply--Streamline-Flex.svg",
  "hand-heart": "/icons/streamline/Insurance-Hand-1--Streamline-Flex.svg",
  scale: "/icons/streamline/Check-Square--Streamline-Flex.svg",
  "book-open": "/icons/streamline/Book-Reading--Streamline-Flex.svg",
  "happy-face": "/icons/streamline/Happy-Face--Streamline-Flex.svg",
};

export function StreamlineAssetIcon({
  name,
  className = "w-7 h-7",
}: {
  name: string;
  className?: string;
}) {
  const src = STREAMLINE_ICON_FILES[name];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" aria-hidden="true" className={className} />
    );
  }
  return <BookOpen className={className} aria-hidden="true" />;
}

export function CategoryIcon({
  name,
  className = "w-6 h-6",
}: {
  name: string;
  className?: string;
}) {
  switch (name) {
    case "heart-handshake":
      return <HeartHandshake className={className} aria-hidden="true" />;
    case "shield-alert":
      return <ShieldAlert className={className} aria-hidden="true" />;
    case "messages-square":
      return <MessagesSquare className={className} aria-hidden="true" />;
    case "message-circle-check":
      return <MessageCircleCheck className={className} aria-hidden="true" />;
    case "hand-heart":
      return <HandHeart className={className} aria-hidden="true" />;
    case "scale":
      return <Scale className={className} aria-hidden="true" />;
    default:
      return <BookOpen className={className} aria-hidden="true" />;
  }
}
