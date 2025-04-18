import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { BotHeroSection } from "@/components/BotHeroSection";
import { SectionTitle } from "@/components/SectionTitle";
import { Video } from "@/components/Video";
import { Faq } from "@/components/Faq";
import { LunarChroniclesCard } from "@/components/LunarFeatureCard";
import { LunarFeatureSection } from "@/components/LunarFeatureSection";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GitBranch, Layers, Moon, PenTool, Sparkles, TreePine } from "lucide-react";
import { MazeFeatureCard } from "@/components/MazeFeatureCard";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Explore Our <span className="text-indigo-600 dark:text-indigo-400">NFT Collections</span>
            </h2>
            <div className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Dive into multiple collections, each offering unique generative art experiences
              powered by advanced algorithms and blockchain technology.
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Lunar Chronicles Card - Dinâmico */}
            <LunarChroniclesCard />
            
            {/* Fractal Swarm Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
              <div className="relative h-60 overflow-hidden">
                <Image 
                  src="/Fractal2.png" 
                  alt="Fractal Swarm Collection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">Fractal Swarm</h3>
                  <div className="text-gray-200">Interactive particle simulations</div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <PenTool size={16} className="text-indigo-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">12 Styles</span>
                  </div>
                  <div className="flex items-center">
                    <Layers size={16} className="text-indigo-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">18 Colors</span>
                  </div>
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                  Dynamic particle-based fractal art with over 2 million unique combinations, 
                  eternally preserved on the blockchain.
                </div>
                <div className="flex gap-2">
                  <Link href="/fractal-swarm" className="flex-1">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Explore Fractal Swarm
                    </Button>
                  </Link>
                  <Link 
                    href="https://opensea.io/collection/fractalswarmnft" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button 
                      variant="outline" 
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 border-indigo-600 flex items-center justify-center"
                    >
                      <Image 
                        src="/icons/openseatransparent.svg" 
                        alt="OpenSea" 
                        width={20} 
                        height={20} 
                      />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Fractal Tree Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
              <div className="relative h-60 overflow-hidden bg-gradient-to-br from-emerald-400/20 to-blue-500/20">
                <Image 
                  src="/fractaltree2.png" 
                  alt="FractalTree"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">Fractal Trees</h3>
                  <div className="text-gray-200">Generative recursive trees</div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <GitBranch size={16} className="text-emerald-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Custom Branches</span>
                  </div>
                  <div className="flex items-center">
                    <Layers size={16} className="text-emerald-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Multiple Styles</span>
                  </div>
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                  Create your own unique fractal trees with our advanced generator. 
                  Customize every aspect and mint your creation as an NFT.
                </div>
                <div className="flex gap-2">
                  <Link href="/fractal-generator" className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Create Your Tree
                    </Button>
                  </Link>
                  <Link 
                    href="https://opensea.io/collection/fractal-tree-ga" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button 
                      variant="outline" 
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 flex items-center justify-center"
                    >
                      <Image 
                        src="/icons/openseatransparent.svg" 
                        alt="OpenSea" 
                        width={20} 
                        height={20} 
                      />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Murmuration Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
              <div className="relative h-60 overflow-hidden bg-gradient-to-br from-purple-400/20 to-pink-500/20">
                <Image 
                  src="/murmuration.jpg" 
                  alt="Murmuration666"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">Murmuration 666</h3>
                  <div className="text-gray-200">Flocking Behaviors Collection</div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <Sparkles size={16} className="text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">666 Items</span>
                  </div>
                  <div className="flex items-center">
                    <Layers size={16} className="text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Limited Edition</span>
                  </div>
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                  Witness the breathtaking beauty of simulated flocking behaviors in our 
                  exclusive 666-piece limited collection.
                </div>
                <div className="flex gap-2">
                  <Link href="/murmuration" className="flex-1">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      View Murmuration 666
                    </Button>
                  </Link>
                  <Link 
                    href="https://opensea.io/collection/murmuration-666" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button 
                      variant="outline" 
                      className="p-2 bg-purple-600 hover:bg-purple-700 border-purple-600 flex items-center justify-center"
                    >
                      <Image 
                        src="/icons/openseatransparent.svg" 
                        alt="OpenSea" 
                        width={20} 
                        height={20} 
                      />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <MazeFeatureCard />
          </div>
        </Container>
      </section>

      {/* Lunar Chronicles Feature Section - Dinâmica */}
      <LunarFeatureSection />
      
      {/* Fractal Tree Generator Highlight */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 mb-6 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                Interactive Tool
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Create Your Own <span className="text-emerald-600 dark:text-emerald-400">Fractal Tree</span>
              </h2>
              <div className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Our advanced Fractal Tree Generator allows you to create, customize, and mint 
                your own unique algorithmic tree art as NFTs.
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-emerald-500">
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Customizable Parameters</h4>
                    <div className="text-gray-600 dark:text-gray-400">Control branch count, angles, length ratios, and more</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-emerald-500">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Multiple Color Schemes</h4>
                    <div className="text-gray-600 dark:text-gray-400">Choose from gradient, rainbow, neon, and more</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-emerald-500">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Animation Effects</h4>
                    <div className="text-gray-600 dark:text-gray-400">Add wind, growth animation, and particles</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1 text-emerald-500">
                    <PenTool size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Preset Templates</h4>
                    <div className="text-gray-600 dark:text-gray-400">Start with beautiful pre-designed templates</div>
                  </div>
                </div>
              </div>
              
              <Link href="/fractal-generator">
                <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium px-8 py-6 text-lg rounded-xl">
                  Generate and Mint
                </Button>
              </Link>
            </div>
            
            <div className="flex-1 relative">
              <div className="relative bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl">
                <div className="aspect-square w-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg overflow-hidden">
                  {/* Fractal Tree Image */}
                  <div className="relative w-full h-full">
                    <Image 
                      src="/FractalTree.png" 
                      alt="Fractal Tree Example" 
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent mix-blend-overlay"></div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Fractal Tree #129873</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Complexity: 78.5%</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    <div className="w-4 h-4 rounded-full bg-teal-500"></div>
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-full blur-xl -z-10"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-full blur-xl -z-10"></div>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Bot Hero Section */}
      <BotHeroSection />
      
    <section className="py-20 bg-white dark:bg-gray-900">
  <Container>
    <SectionTitle
      preTitle="Watch"
      title="See Our NFT Collections in Action"
    >
      <div className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
        Watch our demonstration videos to understand how our NFTs work
        and what makes them unique in the blockchain space.
      </div>
    </SectionTitle>
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {/* Lunar Chronicles Video */}
      <div className="flex flex-col">
        <Video 
          videoPath="/Moonphase.mp4" 
          title="Lunar Chronicles Demo"
          autoPlay={true}
          muted={true}
          loop={true}
        />
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lunar Chronicles</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Each Token changes its image automatically based on the current moon phase.
          </p>
        </div>
      </div>
      
      {/* Fractal Swarm Video */}
      <div className="flex flex-col">
        <Video 
          videoPath="/FractalSwarm.mp4" 
          title="Fractal Swarm Demo"
          autoPlay={true}
          muted={true}
          loop={true}
        />
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fractal Swarm Demo</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Interactive particle-based fractal art with over 2 million unique combinations.
          </p>
        </div>
      </div>
      
      {/* Murmuration Video */}
      <div className="flex flex-col">
        <Video 
          videoPath="/murmuration.mp4"
          title="Murmuration 666"
          autoPlay={true}
          muted={true}
          loop={true}
        />
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Murmuration 666</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Witness the breathtaking beauty of our simulated flocking behaviors collection.
          </p>
        </div>
      </div>
    </div>
  </Container>
</section>


      
      {/* FAQ Section */}
      <Faq />
    </>
  );
}