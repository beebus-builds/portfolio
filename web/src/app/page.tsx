import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <main className="bg-zinc-950 min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <Projects />
      <Contact />
      
      <footer className="py-12 text-center text-zinc-600 text-sm border-t border-zinc-900">
        <p>© {new Date().getFullYear()} Creative Portfolio. Built with Next.js & Three.js</p>
      </footer>
    </main>
  );
}
