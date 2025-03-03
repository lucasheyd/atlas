import { Container } from "@/components/Container";
import React from "react";

interface SectionTitleProps {
  preTitle?: string;
  title?: string;
  children?: React.ReactNode;
}

export const SectionTitle = ({
  preTitle,
  title,
  children,
}: SectionTitleProps) => {
  return (
    <Container>
      <div className="text-center max-w-4xl mx-auto">
        {preTitle && (
          <div className="text-sm font-bold tracking-wider text-indigo-600 uppercase mb-1 dark:text-indigo-400">
            {preTitle}
          </div>
        )}
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold leading-snug tracking-tight text-gray-800 lg:leading-tight dark:text-white">
            {title}
          </h2>
        )}
        <div className="max-w-2xl py-4 mx-auto text-lg leading-normal text-gray-500 lg:text-xl xl:text-xl dark:text-gray-300">
          {children}
        </div>
      </div>
    </Container>
  );
};

export default SectionTitle;