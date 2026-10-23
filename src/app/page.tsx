import { About } from "@/components/about";
import { BottomBlur } from "@/components/bottom-blur";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative w-full scroll-mt-20"
      >
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
      <Footer />
      <div id="page-end" aria-hidden="true" className="h-px w-full" />
      <BottomBlur />
    </>
  );
}
