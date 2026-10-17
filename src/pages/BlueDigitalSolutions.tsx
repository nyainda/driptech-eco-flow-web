import { Helmet } from "react-helmet-async";
import { ArrowRight, Code2, Search, Settings2, Workflow } from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const services = [
  {
    icon: Code2,
    title: "Business websites",
    description: "Responsive, accessible websites that explain your offer clearly and make it easy for customers to contact you.",
  },
  {
    icon: Settings2,
    title: "Business systems",
    description: "Practical digital tools for everyday operations, including stock, sales, customer and workflow management.",
  },
  {
    icon: Search,
    title: "SEO and performance",
    description: "Technical improvements, useful service content and on-page SEO that help the right customers discover your business.",
  },
  {
    icon: Workflow,
    title: "Automation and integrations",
    description: "Connect repetitive tasks and business tools to reduce manual work and keep information organised.",
  },
];

const BlueDigitalSolutions = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Helmet>
      <title>Blue Digital Solutions | Websites, Business Systems & SEO in Kenya</title>
      <meta name="description" content="Blue Digital Solutions helps Kenyan businesses build responsive websites, practical business systems, improve technical SEO and automate workflows." />
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href="https://www.dripstech.co.ke/blue-digital-solutions" />
      <meta property="og:title" content="Blue Digital Solutions | Digital Services in Kenya" />
      <meta property="og:description" content="Websites, business systems, SEO and practical automation for growing businesses." />
      <meta property="og:url" content="https://www.dripstech.co.ke/blue-digital-solutions" />
    </Helmet>
    <Header />
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Digital services for growing businesses
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Make your business work better online.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Blue Digital Solutions builds useful websites, business systems and automation that solve real operational problems—not just digital products that look good.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="mailto:oyugibruce2017@gmail.com?subject=Blue%20Digital%20Solutions%20enquiry" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                Discuss a project <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#services" className="inline-flex min-h-12 items-center rounded-md border border-border px-5 py-3 font-semibold transition-colors hover:bg-muted">
                Explore services
              </a>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Serving small businesses and teams in Kenya, with remote support available.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" /></div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">What we do</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Digital solutions shaped around your work</h2>
          <p className="mt-4 leading-7 text-muted-foreground">Start with the business challenge, choose the simplest useful solution, then improve it as your needs grow.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {services.map(({ icon: Icon, title, description }, index) => (
            <article key={title} className="flex gap-4 rounded-2xl border border-border p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">0{index + 1}</p>
                <h3 className="mt-1 text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Have a process you want to improve?</h2>
            <p className="mt-3 leading-7 text-muted-foreground">Share the problem and we can discuss a sensible next step, scope and timeline.</p>
          </div>
          <a href="mailto:oyugibruce2017@gmail.com?subject=Blue%20Digital%20Solutions%20project" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Get in touch <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default BlueDigitalSolutions;
