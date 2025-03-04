import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import heroImg from "public/Fractal2.png";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-indigo-50/30 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 sm:py-20">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-400/20 blur-3xl dark:from-indigo-900/20 dark:to-purple-900/20"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200/20 to-cyan-300/20 blur-3xl dark:from-blue-900/20 dark:to-cyan-900/20"></div>
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 max-w-2xl">
            <div className="inline-block px-3 py-1 mb-6 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              Generative Algorithmic Art NFTs
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Fractal Swarm:
              </span>{" "}
              Interactive Art Collectibles
            </h1>
            <div className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Discover a groundbreaking NFT collection where each token is a unique generative artwork. 
              With 12 connection styles, 18 color schemes, 8 density levels, and multiple traits, 
              Fractal Swarm offers over 2 million unique combinations eternally captured on the Base blockchain.
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/mint" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-8 py-6 text-lg rounded-xl">
                  Mint Your Fractal
                </Button>
              </Link>
              <Link href="/fractal-generator" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-medium px-8 py-6 text-lg rounded-xl">
                  Try the Generator
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center mr-6">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                On-chain metadata
              </span>
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Interactive artwork
              </span>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg">
            <div className="relative">
              {/* Decorative elements around the image */}
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-xl"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-full blur-xl"></div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                <Image
                  src={heroImg}
                  width={616}
                  height={617}
                  className="w-full h-auto object-cover rounded-2xl transform transition-transform hover:scale-102"
                  alt="Fractal Swarm NFT Illustration"
                  priority
                  placeholder="blur"
                />
                
                {/* Animated overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-purple-600/10 dark:from-indigo-700/20 dark:to-purple-700/20"></div>
              </div>
              
              {/* Stats */}
              <div className="absolute -bottom-8 -right-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Unique Combinations</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">2M+</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Color Schemes</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">18</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Connection Styles</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">12</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Hero;