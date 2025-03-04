"use client";
import React from "react";
import { Container } from "@/components/Container";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/24/solid";

export const Faq = () => {
  return (
    <Container className="!p-0">
      <div className="w-full max-w-2xl p-2 mx-auto rounded-2xl">
        {faqdata.map((item) => (
          <Disclosure as="div" key={item.question} className="mb-5">
            {({ open }) => (
              <>
                <Disclosure.Button className="flex items-center justify-between w-full px-4 py-4 text-lg text-left text-gray-800 rounded-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-100 focus-visible:ring-opacity-75 dark:bg-trueGray-800 dark:text-gray-200">
                  <span>{item.question}</span>
                  <ChevronUpIcon
                    className={`${
                      open ? "transform rotate-180" : ""
                    } w-5 h-5 text-indigo-500`}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pt-4 pb-2 text-gray-500 dark:text-gray-300">
                  {item.answer}
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </Container>
  );
}

const faqdata = [
  {
    question: "What is Fractal Swarm NFT?",
    answer: "Fractal Swarm is a generative NFT project that creates unique, dynamically generated fractal art pieces. Each NFT is a living, interactive artwork with customizable traits like connection styles, color schemes, particle types, and motion patterns.",
  },
  {
    question: "How many Fractal Swarm NFTs will be available?",
    answer: "The total supply is limited to 10,000 unique Fractal Swarm NFTs. Each NFT is procedurally generated with unique characteristics, ensuring no two are exactly alike.",
  },
  {
    question: "What makes each Fractal Swarm NFT unique?",
    answer: "Each NFT is generated with six unique traits: Connection Style, Color Scheme, Density Level, Motion Pattern, Particle Type, and Effect Type. These traits create a complex, one-of-a-kind generative artwork that changes dynamically.",
  },
  {
    question: "How can I mint a Fractal Swarm NFT?",
    answer: "You can mint a Fractal Swarm NFT directly through our smart contract. Each NFT has a low mint price, and you can mint individual or multiple NFTs in a single transaction.",
  },
  {
    question: "Can I interact with my Fractal Swarm NFT?",
    answer: "Absolutely! Each NFT comes with interactive controls. You can adjust motion speed, connection density, and pause/resume the animation. The artwork is a living, breathing digital experience.",
  },
  {
    question: "What blockchain is Fractal Swarm NFT on?",
    answer: "Fractal Swarm NFT is deployed on the Ethereum blockchain, utilizing the ERC721 standard with additional ERC2981 royalty support.",
  },
  {
    question: "Are there royalties for creators and collectors?",
    answer: "Yes, the contract supports royalty standards. Creators and the project can set up royalty configurations to receive a percentage of secondary market sales.",
  },
  {
    question: "What are the different traits in Fractal Swarm NFTs?",
    answer: "We offer diverse traits: 12 Connection Styles (like Neural, Linear, Zigzag), 18 Color Schemes (from Cosmic Abyss to Neon Cyberpunk), 8 Density Levels, 9 Motion Patterns, 12 Particle Types, and 11 Effect Types.",
  },
  {
    question: "Can I see the NFT's metadata and traits?",
    answer: "Each NFT has comprehensive metadata including all trait names, a generative HTML animation, and a preview SVG. You can retrieve this information directly from the blockchain.",
  }
];

export default Faq;