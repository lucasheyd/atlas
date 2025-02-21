import { Container } from "@/components/Container";
import { Web3Interaction } from "@/components/Web3Interaction";
import { SectionTitle } from "@/components/SectionTitle";

export default function PaginaContrato() {
  return (
    <Container>
      <SectionTitle 
        preTitle="Interação Web3" 
        title="Interaja com seu Contrato Inteligente"
      >
        Conecte sua carteira e interaja diretamente com o contrato blockchain nesta página.
      </SectionTitle>
      
      <Web3Interaction />
    </Container>
  );
}