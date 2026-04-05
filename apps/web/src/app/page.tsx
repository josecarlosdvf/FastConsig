import { Container, FormSection, PageHeader, Button } from "@fastconsig/ui";
import Link from "next/link";
import { ControlLayout } from "./control-layout";

export default function HomePage() {
  return (
    <ControlLayout>
      <Container size="md">
        <PageHeader
          title="FastConsig"
          description="Control Plane dinâmico e responsivo para operação do sistema."
          actions={(
            <Link href="/plugins">
              <Button type="button" size="sm">Ver plugins</Button>
            </Link>
          )}
        />
        <FormSection title="MVP utilizável" description="Navegue pelas telas no menu lateral.">
          <span>Login, usuários, configurações, auditoria, eventos, operações e páginas declarativas.</span>
        </FormSection>
      </Container>
    </ControlLayout>
  );
}
