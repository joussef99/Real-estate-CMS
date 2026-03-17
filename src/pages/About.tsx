import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Award, Gem, Lightbulb, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { SectionHeading } from '../components/ui/section-heading';

const founders = [
  {
    name: 'Nour Hassan',
    role: 'Chief Executive Officer',
    bio: 'Nour leads strategy and partnerships with a clear focus on long-term value and world-class client experience.',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Karim Adel',
    role: 'Co-Founder & Investment Director',
    bio: 'Karim shapes our investment lens, selecting high-growth opportunities across Egypt\'s most desirable locations.',
    image:
      'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Maya Fares',
    role: 'Co-Founder & Design Director',
    bio: 'Maya brings a modern design perspective to every touchpoint, ensuring elegant and intuitive experiences.',
    image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=900',
  },
];

const values = [
  {
    title: 'Trust',
    description: 'Every recommendation is backed by transparent data, verified insights, and honest advisory.',
    icon: ShieldCheck,
  },
  {
    title: 'Quality',
    description: 'We curate only premium projects from top developers with proven delivery and craftsmanship.',
    icon: Award,
  },
  {
    title: 'Innovation',
    description: 'From discovery to decision, our digital journey is built for clarity, speed, and confidence.',
    icon: Lightbulb,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function About() {
  return (
    <div className="overflow-x-hidden bg-slate-50 text-slate-900">
      <section className="relative flex min-h-[78vh] items-center overflow-hidden px-6 pb-20 pt-32">
        <motion.img
          initial={{ scale: 1.08, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2200"
          alt="Luxury modern architecture"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-900/65 to-slate-900/30" />

        <div className="relative mx-auto w-full max-w-7xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-white/80">About Livin Investment</p>
            <h1 className="text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">About Our Vision</h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-200">
              We build meaningful pathways to premium real estate by combining market intelligence, curated opportunities, and elevated service.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <SectionHeading
              eyebrow="Company Story"
              title="We Turn Ambition Into Signature Addresses"
              description=""
              align="left"
            />
            <div className="space-y-5 text-slate-600">
              <p>
                We are a modern real estate company focused on helping buyers and investors discover landmark projects in Egypt's most sought-after destinations.
              </p>
              <p>
                Our mission is to simplify complex decisions with trusted guidance, transparent insight, and a curated portfolio built for long-term value.
              </p>
              <p>
                Our vision is to become the benchmark for premium property experiences where design, technology, and advisory work seamlessly together.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/20 shadow-xl backdrop-blur"
          >
            <img
              src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&q=80&w=1800"
              alt="Modern city skyline"
              className="h-full min-h-105 w-full object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-slate-900/10 to-transparent" />
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Leadership"
            title="Founders Who Shape The Future"
            description="A multidisciplinary leadership team blending investment expertise, market depth, and refined design thinking."
            align="center"
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {founders.map((founder, index) => (
              <motion.article
                key={founder.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                whileHover={{ scale: 1.05 }}
                className="overflow-hidden rounded-2xl border border-white/50 bg-white/20 shadow-lg backdrop-blur"
              >
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/65 via-transparent to-transparent" />
                </div>
                <div className="space-y-3 p-6">
                  <h3 className="text-2xl font-semibold text-slate-950">{founder.name}</h3>
                  <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">{founder.role}</p>
                  <p className="leading-relaxed text-slate-600">{founder.bio}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Core Values"
            title="Principles Behind Every Recommendation"
            description="Our standards guide how we select projects, advise clients, and deliver premium outcomes."
            align="center"
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.article
                  key={value.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/20 bg-white/10 p-7 shadow-xl backdrop-blur"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/15">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold">{value.title}</h3>
                  <p className="text-white/80">{value.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xl md:p-14"
        >
          <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Gem className="h-6 w-6" />
          </div>
          <h2 className="text-4xl font-bold text-slate-950 md:text-5xl">Start Your Journey With Us</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Explore our latest premium projects and find the address that aligns with your ambitions.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/projects" className="inline-flex items-center gap-2">
                Explore Projects <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
