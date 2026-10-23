import { Footer } from "@/components/shared/Footer";

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
