import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Benefits } from "@/components/Benefits";
import { Video } from "@/components/Video";
import { Faq } from "@/components/Faq";
import { Cta } from "@/components/Cta";

import { benefitOne, benefitTwo } from "@/components/data";

export default function Home() {
  return (
    <Container>
      <Hero />


      <SectionTitle
        preTitle="Watch a video"
        title="Know what you're minting"
      >
      </SectionTitle>

      <Video videoId="fZ0D0cnR88E" />

      <Faq />
    </Container>
  );
}