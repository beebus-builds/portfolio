import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <Projects />
      <Contact />
      
      <footer className="py-12 text-center text-zinc-400 dark:text-zinc-600 text-sm border-t border-zinc-200 dark:border-zinc-900 bg-neutral-50 dark:bg-transparent transition-colors">
        <p>© {new Date().getFullYear()} Creative Portfolio. Built with Next.js & Three.js</p>
      </footer>
    </main>
  );
}
