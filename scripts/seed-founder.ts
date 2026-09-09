/**
 * Seeds the founder profile into Settings.
 *
 *   pnpm seed:founder
 *
 * Everything here is admin-editable at /admin/settings afterwards — this only
 * populates the record so the page is not empty on a fresh install. Re-running
 * overwrites the founder fields it sets, so edit in the admin rather than here
 * once the site is live.
 */
import mongoose from "mongoose";
import { Settings } from "../src/models/index";

const story = `
<h2>Early life</h2>
<p>Nitheesh Rajendran is an Indian entrepreneur, software developer, and technology enthusiast from Tamil Nadu, India. From a young age he developed a strong interest in computers, design, and the internet. That curiosity moved from learning website development to building complete software products, mobile applications, and AI-powered solutions.</p>
<p>While pursuing his Bachelor's degree in Artificial Intelligence and Machine Learning, he focused on gaining practical industry experience through real-world projects rather than limiting himself to academic work. That early interest in technology laid the foundation for his entrepreneurial journey.</p>

<h2>Career</h2>
<p>Nitheesh began professionally as a freelance web developer, building websites and digital solutions for businesses and startups. He expanded into full-stack software engineering, mobile application development, UI/UX design, digital marketing, cloud deployment, and artificial intelligence.</p>
<p>His work spans business websites, e-commerce platforms, AI-powered applications, automation tools, custom dashboards, and enterprise software — alongside branding, SEO, product strategy, and client management. The goal throughout has been to build complete digital ecosystems rather than individual websites or applications.</p>

<h2>Setups Works</h2>
<p>Setups Works is a digital agency founded by Nitheesh Rajendran to help startups, businesses, and enterprises establish a strong digital presence through modern technology.</p>
<p>Under his leadership the agency focuses on scalable, secure, user-centric digital products. The long-term vision is to grow Setups Works into a globally recognised technology company building software used by businesses around the world.</p>

<h2>Software and AI projects</h2>
<p>Nitheesh has built software applications, AI-powered tools, and digital products across a range of industries — AI business solutions, full-stack SaaS applications, CRM and ERP systems, business automation platforms, e-commerce applications, mobile apps, AI chatbots and content tools, workflow automation, developer tools, dashboards, API and payment gateway integrations, and analytics platforms.</p>
<p>He works actively with modern technologies including large language models, AI automation, cloud infrastructure, and intelligent software systems.</p>

<h2>Cybersecurity research</h2>
<p>Alongside development, Nitheesh has a growing interest in cybersecurity and web application security. He studies common vulnerabilities, secure coding practices, and application security to understand how digital platforms can be made safer.</p>
<p>His research focuses on web application security, authentication and API security, secure development practices, security testing, the OWASP Top 10, secure architecture, and vulnerability analysis — with the objective of helping organisations improve the security of their products through responsible research.</p>

<h2>Responsible disclosure</h2>
<p>Nitheesh follows the principles of responsible vulnerability disclosure. When identifying security issues in publicly accessible web applications, he reports them privately to the organisation concerned rather than exposing sensitive information publicly.</p>
<p>He believes responsible disclosure contributes to a safer internet by allowing organisations to resolve vulnerabilities before they can be exploited.</p>

<h2>Films and creative work</h2>
<p>Beyond technology, Nitheesh has a strong interest in filmmaking and digital storytelling — film direction, story writing, screenplay development, video production, cinematography, editing, motion graphics, creative branding, and digital content creation.</p>
<p>He believes creativity and technology complement each other, and that the combination is what makes digital experiences engaging.</p>

<h2>Vision</h2>
<p>His long-term vision is to build globally recognised software products that solve real business problems through technology, artificial intelligence, and innovation — establishing Setups Works as an international technology company known for secure, scalable, AI-powered digital solutions.</p>
<blockquote>Build technology that creates impact, solve meaningful problems, empower businesses through innovation, and establish Setups Works as a globally trusted technology brand.</blockquote>
`.trim();

const skillGroups = [
  { label: "Programming languages", items: ["JavaScript", "TypeScript", "Python", "Java", "HTML", "CSS", "SQL"] },
  { label: "Frontend", items: ["React.js", "Next.js", "Flutter", "React Native", "Tailwind CSS", "Bootstrap"] },
  { label: "Backend", items: ["Node.js", "Express.js", "REST APIs"] },
  { label: "Databases", items: ["MongoDB", "PostgreSQL", "Firebase", "Supabase", "MySQL"] },
  { label: "Artificial intelligence", items: ["Generative AI", "AI Integration", "Prompt Engineering", "AI Automation", "LLM Applications"] },
  { label: "UI/UX", items: ["Figma", "Wireframing", "Prototyping", "Product Design"] },
  { label: "CMS & e-commerce", items: ["WordPress", "WooCommerce", "Shopify", "Webflow"] },
  { label: "Cloud & DevOps", items: ["Git", "GitHub", "Vercel", "Render", "Cloud Deployment"] },
  { label: "Digital marketing", items: ["SEO", "Google Ads", "Meta Ads", "Branding", "Social Media Marketing"] },
  { label: "Cybersecurity", items: ["Responsible Disclosure", "Security Research", "Secure Development Practices", "Web Security Testing"] },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 8000 });
  await Settings.updateOne({ key: "site" }, { $set: {
    "founder.story": story,
    "founder.skillGroups": skillGroups,
    "founder.degree": "Bachelor of Technology (B.Tech)",
    "founder.fieldOfStudy": "Computer Science and Engineering (Artificial Intelligence & Machine Learning)",
    "founder.educationStart": "2022",
    "founder.educationEnd": "2026",
    "founder.credentialCategory": "Bachelor's degree",
    "founder.educationalLevel": "Bachelor",
    "founder.titles": ["Film Director", "Software Developer", "Web Designer", "Digital Marketer"],
    "founder.bio": "Nitheesh Rajendran is an Indian entrepreneur, software developer, and technology enthusiast from Tamil Nadu. He is the Director, Founder & CEO of Setups Works, a digital agency building websites, mobile apps, and AI-powered software.",
  }}, { upsert: true });

  const d = await Settings.findOne({ key: "site" }).lean() as any;
  console.log("  story words   :", d.founder.story.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length);
  console.log("  skill groups  :", d.founder.skillGroups.length, "→", d.founder.skillGroups.reduce((n: number, g: any) => n + g.items.length, 0), "skills");
  console.log("  degree        :", d.founder.degree);
  console.log("  field         :", d.founder.fieldOfStudy.slice(0, 60) + "…");
  console.log("  years         :", d.founder.educationStart, "–", d.founder.educationEnd);
  console.log("  titles        :", d.founder.titles.join(", "));
  await mongoose.disconnect();
})().catch(e => console.log("ERR", e.message));
