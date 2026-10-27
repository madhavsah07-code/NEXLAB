import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/Button';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Menu,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Interactive paths',
    description: 'Build confidence through focused lessons, guided practice, and projects that make ideas stick.',
  },
  {
    icon: Code2,
    title: 'Code in the moment',
    description: 'Move from concept to working code in a responsive browser-based sandbox.',
  },
  {
    icon: Trophy,
    title: 'Progress that matters',
    description: 'Set a pace, collect milestones, and see each completed step add up to real momentum.',
  },
  {
    icon: Users,
    title: 'Learn with others',
    description: 'Stay motivated with a community of curious builders moving in the same direction.',
  },
];

const languages = [
  { label: 'Python', shorthand: 'Py' },
  { label: 'JavaScript', shorthand: 'JS' },
  { label: 'Java', shorthand: 'Ja' },
  { label: 'C++', shorthand: 'C+' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Software developer · Mumbai',
    quote: 'The lessons feel focused, and the sandbox lets me turn a new concept into something real straight away.',
  },
  {
    name: 'Rahul Verma',
    role: 'Data scientist · Bengaluru',
    quote: 'NexLab gave my learning a rhythm. Small wins and visible progress kept me coming back every day.',
  },
  {
    name: 'Ananya Reddy',
    role: 'Full-stack developer · Hyderabad',
    quote: 'It is the rare platform where the course, practice, and community all feel like one experience.',
  },
];

const faqs = [
  {
    question: 'Is NexLab free to use?',
    answer: 'Yes. You can start with free courses and the code sandbox right away. Premium courses are available separately.',
  },
  {
    question: 'Which languages can I practice?',
    answer: 'NexLab supports Python, JavaScript, Java, and C++. Additional languages can be added as the curriculum grows.',
  },
  {
    question: 'Can I track my learning progress?',
    answer: 'Yes. Your dashboard brings lessons, practice, XP, and milestones into a single clear view.',
  },
  {
    question: 'Does the experience work on mobile?',
    answer: 'Yes. The learning experience adapts to smaller screens, so you can study wherever you have a browser.',
  },
];

const LayeredLearningObject: React.FC = () => (
  <div className="relative mx-auto h-[320px] w-full max-w-[510px] sm:h-[380px]" aria-hidden="true">
    <div className="animate-blue-breathe absolute left-[7%] top-[36px] h-[210px] w-[86%] rounded-[999px] border border-white/20 bg-[#03195B] shadow-[0_0_64px_rgba(25,81,252,0.35)]" />
    <div className="animate-glass-rise absolute left-[2%] top-[95px] h-[208px] w-[88%] rounded-[999px] border border-white/25 bg-[linear-gradient(135deg,#03195B,#0B2CB1)] shadow-[inset_0_2px_8px_rgba(255,255,255,0.26),0_0_54px_rgba(25,81,252,0.42)] [animation-delay:80ms]" />
    <div className="animate-glass-rise absolute left-[9%] top-[153px] h-[205px] w-[88%] rounded-[999px] border border-white/30 bg-[linear-gradient(135deg,#0B2CB1,#1951FC)] shadow-[inset_0_2px_8px_rgba(255,255,255,0.35),0_0_58px_rgba(55,129,252,0.48)] [animation-delay:160ms]" />
    <div className="animate-glass-rise absolute left-[16%] top-[209px] h-[186px] w-[78%] rounded-[999px] border-[1.5px] border-white/40 bg-[radial-gradient(120%_140%_at_15%_0%,rgba(255,255,255,0.5),rgba(255,255,255,0)_55%),linear-gradient(135deg,#3781FC,#CBE9FD)] shadow-[inset_0_2px_8px_rgba(255,255,255,0.5),inset_0_-10px_24px_rgba(3,25,91,0.25),0_0_62px_rgba(91,184,251,0.72)] [animation-delay:240ms]" />
    <div className="absolute left-1/2 top-[266px] flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border border-white/50 bg-[#CBE9FD] text-[#03195B] shadow-[0_0_52px_rgba(203,233,253,0.8)]">
      <Code2 className="h-8 w-8" strokeWidth={1.6} />
    </div>
    <div className="absolute right-0 top-3 hidden items-center gap-2 sm:flex">
      <span className="h-px w-11 bg-white/35" />
      <span className="h-2 w-2 rounded-full bg-[#CBE9FD] shadow-[0_0_12px_#CBE9FD]" />
      <span className="text-xs tracking-[0.16em] text-white/80">BUILD</span>
    </div>
    <div className="absolute bottom-2 left-0 hidden items-center gap-2 sm:flex">
      <span className="text-xs tracking-[0.16em] text-white/80">LEARN</span>
      <span className="h-2 w-2 rounded-full bg-[#3781FC] shadow-[0_0_12px_#3781FC]" />
      <span className="h-px w-11 bg-white/35" />
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIsMobileMenuOpen(false);
  };

  const handlePrimaryAction = () => navigate(user ? '/dashboard' : '/register');

  return (
    <div className="page-orbit min-h-screen overflow-x-hidden text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <BrandLogo size="md" showText />

          <div className="hidden items-center gap-7 lg:flex">
            {['features', 'languages', 'stories', 'questions'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-sm tracking-wide text-white/65 transition-colors hover:text-[#CBE9FD]"
              >
                {{ features: 'Experience', languages: 'Languages', stories: 'Stories', questions: 'FAQ' }[item]}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {!user && <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>}
            <Button size="sm" onClick={handlePrimaryAction}>
              {user ? 'Dashboard' : 'Start learning'} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0B2CB1]/50 text-white lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-white/10 bg-black/95 px-5 py-5 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {[
                ['features', 'Experience'],
                ['languages', 'Languages'],
                ['stories', 'Stories'],
                ['questions', 'FAQ'],
              ].map(([id, label]) => (
                <button key={id} onClick={() => scrollToSection(id)} className="rounded-2xl px-4 py-3 text-left text-sm text-white/75 hover:bg-[#1951FC]/20 hover:text-white">
                  {label}
                </button>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3">
                {!user && <Button variant="secondary" fullWidth onClick={() => navigate('/login')}>Sign in</Button>}
                <Button fullWidth onClick={handlePrimaryAction}>{user ? 'Dashboard' : 'Get started'}</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="relative mx-auto grid min-h-[790px] max-w-7xl items-center gap-8 px-5 pb-20 pt-32 sm:px-8 lg:min-h-[720px] lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pt-24">
          <div className="relative z-10 max-w-2xl">
            <div className="animate-glass-rise mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#1951FC]/15 px-4 py-2 text-xs tracking-[0.1em] text-[#CBE9FD] shadow-[0_0_24px_rgba(55,129,252,0.22)]">
              <Sparkles className="h-3.5 w-3.5" />
              A clearer way to become a developer
            </div>
            <h1 className="animate-glass-rise text-balance text-[clamp(3.2rem,7vw,6.15rem)] font-light leading-[0.93] tracking-[-0.055em] [animation-delay:80ms]">
              Learn in <span className="text-[#5BB8FB]">full</span> color.
            </h1>
            <p className="animate-glass-rise mt-7 max-w-xl text-lg leading-relaxed text-white/65 [animation-delay:160ms] sm:text-xl">
              Courses, practice, and a live code workspace—layered into one focused learning environment.
            </p>
            <div className="animate-glass-rise mt-9 flex flex-col gap-3 sm:flex-row [animation-delay:240ms]">
              <Button size="lg" onClick={handlePrimaryAction}>
                {user ? 'Open my dashboard' : 'Start learning free'} <ArrowRight className="h-4 w-4" />
              </Button>
              {!user && (
                <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
                  I already have an account
                </Button>
              )}
            </div>
            <div className="animate-glass-rise mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/60 [animation-delay:320ms]">
              {['No card required', 'Learn at your pace', 'Made for builders'].map((label) => (
                <span key={label} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#5BB8FB]" />{label}</span>
              ))}
            </div>
          </div>

          <div className="relative mt-1 lg:mt-0">
            <div className="absolute inset-4 rounded-full bg-[#1951FC]/25 blur-[100px]" />
            <LayeredLearningObject />
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
          <div className="glass-card grid grid-cols-2 divide-x divide-y divide-white/15 overflow-hidden sm:grid-cols-4 sm:divide-y-0">
            {[
              ['15k+', 'curious learners'],
              ['120+', 'guided courses'],
              ['850+', 'focused lessons'],
              ['4', 'languages to explore'],
            ].map(([value, label], index) => (
              <div key={label} className={`px-5 py-7 text-center sm:px-7 ${index > 1 ? 'sm:border-l sm:border-white/15' : ''}`}>
                <p className="text-3xl font-light tracking-[-0.04em] text-[#CBE9FD] sm:text-4xl">{value}</p>
                <p className="mt-1 text-xs tracking-[0.08em] text-white/55">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-24 border-y border-white/10 bg-[#03195B]/20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs tracking-[0.18em] text-[#5BB8FB]">THE NEXLAB EXPERIENCE</p>
              <h2 className="mt-4 text-4xl font-light tracking-[-0.04em] sm:text-5xl">Every layer has a purpose.</h2>
              <p className="mt-5 text-lg leading-relaxed text-white/60">An intentionally quiet interface keeps your attention on the work and makes the next useful action obvious.</p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {features.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="glass-card group min-h-[265px] p-7 transition duration-500 hover:-translate-y-1 hover:shadow-[0_0_46px_rgba(55,129,252,0.34)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-[#1951FC]/25 text-[#CBE9FD] shadow-[inset_0_1px_4px_rgba(255,255,255,0.28)]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="mt-8 text-xs tracking-[0.15em] text-[#5BB8FB]">0{index + 1}</p>
                  <h3 className="mt-2 text-xl tracking-[-0.025em]">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="languages" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs tracking-[0.18em] text-[#5BB8FB]">YOUR WORKSPACE</p>
              <h2 className="mt-4 text-4xl font-light tracking-[-0.04em] sm:text-5xl">Bring the idea to life while it is still fresh.</h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/60">Choose a language, open the sandbox, and turn the lesson into a working solution without losing context.</p>
              <button onClick={handlePrimaryAction} className="mt-8 inline-flex items-center gap-2 text-sm text-[#CBE9FD] transition-colors hover:text-white">
                Explore the sandbox <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="glass-card p-5 sm:p-8">
              <div className="flex items-center justify-between border-b border-white/15 pb-5">
                <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3781FC]/30 text-[#CBE9FD]"><Code2 className="h-4 w-4" /></div><span className="text-sm text-white/80">sandbox.nexlab</span></div>
                <span className="rounded-full border border-[#5BB8FB]/40 px-3 py-1 text-[10px] tracking-[0.13em] text-[#CBE9FD]">READY</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {languages.map(({ label, shorthand }) => (
                  <div key={label} className="group flex items-center justify-between rounded-[24px] border border-white/20 bg-[#0B2CB1]/35 p-4 transition hover:border-[#CBE9FD]/60 hover:bg-[#1951FC]/30">
                    <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-[#1951FC] text-xs text-white shadow-[0_0_16px_rgba(55,129,252,0.55)]">{shorthand}</span><span className="text-sm">{label}</span></div>
                    <ChevronRight className="h-4 w-4 text-[#5BB8FB] transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[22px] border border-white/15 bg-black/35 p-5 font-mono text-xs leading-7 text-[#CBE9FD]/75">
                <span className="text-[#5BB8FB]">01</span> <span className="text-white/45">// write, run, learn</span><br />
                <span className="text-[#5BB8FB]">02</span> solution = <span className="text-white">learn</span>(concept)<br />
                <span className="text-[#5BB8FB]">03</span> <span className="text-white">print</span>(solution)
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#03195B]/20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="text-center"><p className="text-xs tracking-[0.18em] text-[#5BB8FB]">A CALMER ROUTE FORWARD</p><h2 className="mt-4 text-4xl font-light tracking-[-0.04em] sm:text-5xl">Find your flow, one clear step at a time.</h2></div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                ['01', 'Choose a direction', 'Start with a course that matches what you want to make next.'],
                ['02', 'Practice in context', 'Use the sandbox as you learn—not later, after the details have faded.'],
                ['03', 'See momentum compound', 'Track your work, return with confidence, and take on the next challenge.'],
              ].map(([number, title, description]) => (
                <article key={number} className="rounded-[32px] border border-white/20 bg-[#03195B]/60 p-7 shadow-[inset_0_1px_3px_rgba(255,255,255,0.18)]">
                  <span className="text-4xl font-light tracking-[-0.04em] text-[#5BB8FB]">{number}</span>
                  <h3 className="mt-8 text-xl">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="stories" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs tracking-[0.18em] text-[#5BB8FB]">STORIES FROM THE COMMUNITY</p><h2 className="mt-4 text-4xl font-light tracking-[-0.04em] sm:text-5xl">The glow is in the progress.</h2></div><p className="max-w-sm text-sm leading-relaxed text-white/55">Real learners making space for a little more curiosity, practice, and possibility.</p></div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {testimonials.map(({ name, role, quote }) => (
                <figure key={name} className="glass-card p-7"><div className="flex gap-1 text-[#5BB8FB]">{Array.from({ length: 5 }, (_, index) => <span key={index}>✦</span>)}</div><blockquote className="mt-7 text-lg font-light leading-relaxed text-white/90">“{quote}”</blockquote><figcaption className="mt-8 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1951FC] text-sm shadow-[0_0_18px_rgba(55,129,252,0.5)]">{name.charAt(0)}</span><span><span className="block text-sm">{name}</span><span className="mt-0.5 block text-xs text-white/50">{role}</span></span></figcaption></figure>
              ))}
            </div>
          </div>
        </section>

        <section id="questions" className="scroll-mt-24 border-y border-white/10 bg-[#03195B]/20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div><p className="text-xs tracking-[0.18em] text-[#5BB8FB]">GOOD QUESTIONS</p><h2 className="mt-4 text-4xl font-light tracking-[-0.04em] sm:text-5xl">A few answers before you begin.</h2><p className="mt-5 text-lg leading-relaxed text-white/60">Everything you need to know to take the first step is right here.</p></div>
            <div className="space-y-3">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="group rounded-[24px] border border-white/20 bg-[#03195B]/60 px-6 py-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-base text-white/90"><span>{question}</span><ChevronRight className="h-5 w-5 shrink-0 text-[#5BB8FB] transition-transform group-open:rotate-90" /></summary><p className="max-w-2xl pb-5 text-sm leading-relaxed text-white/60">{answer}</p></details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 lg:py-32">
          <div className="glass-card relative mx-auto max-w-5xl overflow-hidden px-7 py-16 text-center sm:px-12">
            <div className="absolute inset-x-1/4 top-0 h-40 rounded-full bg-[#5BB8FB]/20 blur-[75px]" />
            <div className="relative"><Zap className="mx-auto h-6 w-6 text-[#CBE9FD]" strokeWidth={1.5} /><h2 className="mt-5 text-4xl font-light tracking-[-0.045em] sm:text-5xl">Your next chapter is ready.</h2><p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/65">Bring your questions. We will give them a place to become skills.</p><Button size="lg" className="mt-9" onClick={handlePrimaryAction}>{user ? 'Return to my dashboard' : 'Create your free account'} <ArrowRight className="h-4 w-4" /></Button></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between"><BrandLogo size="sm" showText /><div className="flex flex-wrap gap-x-6 gap-y-2"><span>Learn with intention</span><span>Build with confidence</span><span>© {new Date().getFullYear()} NexLab</span></div></div>
      </footer>
    </div>
  );
};
