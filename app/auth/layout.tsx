import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accedi - Il Diario di Nico & Angie',
  description: 'Accedi al vostro diario d\'amore personale',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
