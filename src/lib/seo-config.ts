// SEO Configuration and Constants
// Centralized SEO settings for the DripTech Eco Flow website

export const SEO_CONFIG = {
    siteName: "DripTech Eco Flow",
    siteUrl: "https://www.dripstech.co.ke",
    defaultTitle: "Irrigation Materials Kenya | Driplines, Sprinklers, Irrigation Kits - DripTech Eco Flow",
    defaultDescription: "Drip irrigation kits, driplines, sprinklers, pumps and filters for farms in Kenya. Sizing help, supply and installation across the country.",
    defaultImage: "https://www.dripstech.co.ke/hero-bg-new-desktop.webp",
    twitterHandle: "@driptech_eco",
    phone: "+254723407849",
    email: "info@dripstech.co.ke",
};

// Common FAQs for different pages
export const COMMON_FAQS = {
    homepage: [
        {
            question: "What irrigation services does DripTech Eco Flow provide in Kenya?",
            answer: "DripTech Eco Flow supplies dripline, sprinkler equipment, pumps, filters, pipes, fittings and irrigation kits, and provides irrigation design, installation support and maintenance services. The right system depends on your crop, field layout, water source and operating conditions. Contact the team to confirm product availability and which services are available for your location."
        },
        {
            question: "How much does a drip irrigation system cost in Kenya?",
            answer: "Irrigation system cost depends on the area to be irrigated, crop spacing, water source, filtration, pump requirements, pipe lengths, automation and installation scope. Review current kit and product listings, then request a quote based on your farm layout. A price should state clearly which materials, transport and labour are included."
        },
        {
            question: "What areas in Kenya does DripTech Eco Flow serve?",
            answer: "DripTech supplies irrigation equipment across Kenya and can help customers confirm delivery options for their location. On-site design, installation and maintenance arrangements depend on the project and availability; confirm these details and any travel charges before booking."
        },
        {
            question: "How long does irrigation installation take?",
            answer: "There is no fixed installation time for every farm. The schedule depends on the irrigated area, water-source setup, trenching or other site work, system complexity and material availability. Ask for an estimated timetable after the scope is reviewed."
        },
        {
            question: "How much water does drip irrigation save?",
            answer: "Drip irrigation applies water near the crop root zone and can reduce avoidable losses when the system is designed and operated correctly. Actual water savings depend on the previous irrigation method, crop, soil, weather, system design and management, so savings should be estimated for a specific farm rather than promised as a universal percentage."
        }
    ],

    products: [
        {
            question: "What's the difference between 15cm, 20cm, and 30cm dripline spacing?",
            answer: "Dripline spacing determines how close the emitters are: 15cm spacing is ideal for closely-spaced crops like vegetables and flowers, providing more frequent watering points. 20cm spacing works well for general crops and row vegetables. 30cm spacing is suitable for wider-spaced row crops and orchards. The choice depends on your crop type and spacing."
        },
        {
            question: "Which irrigation system is best for small farms in Kenya?",
            answer: "For a small farm, drip irrigation can be a good option for many row crops when water pressure, filtration and crop spacing are suitable. Compare current kit specifications and confirm coverage, included components and any installation or transport costs before choosing. Payback depends on crop, yields, water cost and how the system is operated."
        },
        {
            question: "Do you offer irrigation system warranties?",
            answer: "Warranty terms vary by product, manufacturer and purchase. Check the product listing or manual and ask the sales team to confirm the duration, covered defects, exclusions and whether installation labour is included. Request the final warranty terms in writing."
        },
        {
            question: "What irrigation products are suitable for greenhouses?",
            answer: "For greenhouses, we recommend precision drip irrigation systems with 15cm or 20cm spacing, micro-sprinklers for humidity control, automated controllers with timers, and fertigation systems for nutrient delivery. We also provide specialized greenhouse kits with all necessary components including filters, pressure regulators, and valves."
        }
    ],

    services: [
        {
            question: "Do you provide free irrigation system consultations?",
            answer: "DripTech offers farm assessments; contact the team to confirm availability for your location and what the assessment covers. Ask for a written quote and check whether transport, installation or any additional site work is included before proceeding."
        },
        {
            question: "How often should irrigation systems be maintained?",
            answer: "Maintenance frequency depends on the manufacturer’s guidance, water quality and system use. Typical checks include cleaning filters, flushing lines, inspecting emitters, checking pressure and looking for leaks. The cost of professional service depends on system size, site location and the work required; request a project-specific quote."
        },
        {
            question: "Can you install irrigation systems nationwide in Kenya?",
            answer: "DripTech serves customers across Kenya. Confirm installation availability for your exact location and project scope, and ask the quote to list materials, transport, labour, testing and training separately. Do not assume installation is included in every kit price unless the quote says so."
        },
        {
            question: "What's included in your installation service?",
            answer: "Request a written scope that identifies the materials supplied, labour, transport, testing, farmer training and warranty terms. These items can vary by project, so confirm exactly what is included in your quote and what may cost extra."
        }
    ]
};

// Page-specific SEO metadata
export const PAGE_SEO = {
    home: {
        title: "Irrigation Materials Kenya | Driplines, Sprinklers, Irrigation Kits - DripTech Eco Flow",
        description: "Browse dripline, sprinkler systems, pipes, filters, pumps, fittings and irrigation kits for farms in Kenya. Check current product details and arrange nationwide delivery or project-specific installation support.",
        keywords: "irrigation materials Kenya, dripline Kenya, irrigation kits, sprinkler systems, drip irrigation pipes, irrigation fittings, water pumps Kenya, farm irrigation solutions"
    },

    products: {
        title: "Irrigation Products & Equipment Kenya | DripTech Eco Flow Catalog",
        description: "Browse irrigation products for Kenyan farms, including driplines, sprinklers, filters, pumps, pipes, fittings and accessories. Check each listing for specifications, current pricing, warranty terms and delivery options.",
        keywords: "irrigation products Kenya, dripline prices, sprinkler systems, irrigation equipment, water pumps, irrigation filters, drip tape, irrigation accessories"
    },

    services: {
        title: "Professional Irrigation Services Kenya | Installation & Maintenance",
        description: "Irrigation system design, installation, maintenance and repair support across Kenya. Contact DripTech for a farm assessment and a quote tailored to your location, water source and project requirements.",
        keywords: "irrigation installation Kenya, irrigation services, drip system installation, irrigation maintenance, irrigation repair, agricultural consulting"
    },

    about: {
        title: "About DripTech Eco Flow | Irrigation Equipment Kenya",
        description: "DripTech Eco Flow supplies irrigation equipment and supports farm system design, installation and maintenance across Kenya.",
        keywords: "DripTech Eco Flow, irrigation company Kenya, irrigation equipment, irrigation installation"
    },

    contact: {
        title: "Contact DripTech Eco Flow | Irrigation Consultation Kenya",
        description: "Contact DripTech Eco Flow by phone, WhatsApp or email for irrigation product advice, farm assessment arrangements, delivery details and a project-specific quote in Kenya.",
        keywords: "contact DripTech Eco Flow, irrigation consultation Kenya, irrigation quote, irrigation experts Nairobi"
    }
};

// Structured data templates
export const STRUCTURED_DATA_TEMPLATES = {
    organization: {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "DripTech Eco Flow",
        "description": "Irrigation equipment, kits and project support for farms in Kenya.",
        "url": SEO_CONFIG.siteUrl,
        "logo": "https://www.dripstech.co.ke/driptech-logo.png",
        "telephone": SEO_CONFIG.phone,
        "email": SEO_CONFIG.email,
        "acceptedPaymentMethod": ["Cash", "M-Pesa", "Bank Transfer"],
        "areaServed": { "@type": "Country", "name": "Kenya" }
    }
};
