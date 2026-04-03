import { Container, FormSection, PageHeader } from "@fastconsig/ui";

export default function HomePage() {
  return (
    <Container size="md">
      <PageHeader title="FastConsig" description="CRM/ERP para consignado — em breve." />
      <FormSection title="Governança" description="Backend enforced e UI declarativa em evolução." />
    </Container>
  );
}
