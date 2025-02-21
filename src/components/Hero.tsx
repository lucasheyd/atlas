import Image from "next/image";
import { Container } from "@/components/Container";
import heroImg from "../../public/Fractal2.png";

export const Hero = () => {
  return (

      <Container className="flex flex-wrap ">
        <div className="flex items-center w-full lg:w-1/2">
          <div className="max-w-2xl mb-8">
            <h1 className="text-4xl font-bold leading-snug tracking-tight text-gray-800 lg:text-4xl lg:leading-tight xl:text-6xl xl:leading-tight dark:text-white">
              Fractal Swarm: Interactive
            </h1>
            <p className="py-5 text-xl leading-normal text-gray-500 lg:text-xl xl:text-2xl dark:text-gray-300">
              Discover a groundbreaking NFT collection where each token is a unique generative artwork. 
              With 12 connection styles, 18 color schemes, 8 density levels, and multiple other traits, 
              Fractal Swarm offers over 2 million possible unique combinations. 
              Every NFT is a one-of-a-kind algorithmic masterpiece, algorithmically generated 
              and eternally captured on the Base blockchain.
            </p>

            <div className="flex flex-col items-start space-y-3 sm:space-x-4 sm:space-y-0 sm:items-center sm:flex-row">
              <a
                href="mint"
                className="px-8 py-4 text-lg font-medium text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Mint Your Fractal
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center w-full lg:w-1/2">
          <div className="">
            <Image
              src={heroImg}
              width="616"
              height="617"
              className="object-cover rounded-xl shadow-2xl"
              alt="Fractal Swarm NFT Illustration"
              loading="eager"
              placeholder="blur"
            />
          </div>
        </div>
      </Container>

  );
}

export default Hero;