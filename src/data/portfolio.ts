export type PortfolioLink = {
  label: string;
  url: string;
};

export type PortfolioItem = {
  title: string;
  image: string;
  alt: string;
  pills: string[];
  bullets: string[];
  links: PortfolioLink[];
};

export type PortfolioSection = {
  title: string;
  items: PortfolioItem[];
};

export const portfolioSections: PortfolioSection[] = [
  {
    title: 'Projects',
    items: [
      {
        title: 'IGNITIA',
        image: '/images/portfolio/Ignitia.png',
        alt: 'Ignitia Live Portal',
        pills: ['TypeScript', 'React.js', 'GreenSock Animation Platform (GSAP)', 'WebDev'],
        bullets: [
          'Designed and built the official web portal for IGNITIA - the premier multi-domain annual event organized by the IEM-UEM group, UEM Kolkata.',
          'Developed immersive animations and high-performance interactive interfaces using GSAP.',
          'Built using a clean, responsive component architecture with TypeScript and React.js.'
        ],
        links: [
          {
            label: 'Live Site',
            url: 'https://www.ignitia.live/'
          }
        ]
      },
      {
        title: 'Multi-Agent Pedagogical System (MAES)',
        image: '/images/portfolio/MAES.png',
        alt: 'MAES Project',
        pills: ['Python', 'LangGraph', 'Retrieval-Augmented Generation (RAG)', 'Artificial Intelligence (AI)', 'JavaScript'],
        bullets: [
          'Built an AI tutor that helps you learn through conversation, not just information dumps.',
          'Utilized a multi-agent system with LangGraph where one AI acts as the teacher while another acts as an auditor to check for quality and accuracy.',
          'Powered by a custom RAG pipeline that turns PDFs, websites, or YouTube videos into a structured, Socratic learning experience.',
          'Associated with the Innovation and Entrepreneurship Development Cell (Dept. of CSE IoT, CS & BT), UEM, Kolkata.'
        ],
        links: [
          {
            label: 'Live Site',
            url: 'https://maes-backend-d8of1uapz-tridibesh-sen-s-projects.vercel.app/'
          }
        ]
      },
      {
        title: 'THE_FIRST_VOTE',
        image: '/images/portfolio/Fisrt vote (1).png',
        alt: 'THE_FIRST_VOTE',
        pills: ['3D Visualization', 'JavaScript', 'Node.js'],
        bullets: [
          'Designed an immersive 3D gamified simulator to empower and educate young voters.',
          'Incorporated AI-powered guidance from Google Gemini to help navigate real-world electoral challenges.',
          'Teaches users to choose integrity and master the voting booth.'
        ],
        links: [
          {
            label: 'Live Site',
            url: 'https://gdg-prompt-wars-first-vote.web.app/'
          }
        ]
      },
      {
        title: 'Orygin AI',
        image: '/images/portfolio/OryginAI.png',
        alt: 'Orygin AI',
        pills: ['Python', 'Cybersecurity', 'Cryptography', 'OpenAI API', 'Data Analysis', 'MySQL', 'SQL', 'MERN Stack', 'Artificial Intelligence (AI)'],
        bullets: [
          'ORYGIN AI is a full-stack, AI-powered digital media protection platform built on three core pillars.',
          'Seal: Embed invisible, AI-verifiable Digital DNA into every asset at ingest.',
          'Detect: Continuously crawl the internet to find unauthorized copies using AI vision.',
          'Broadcast: Stream live camera feeds with real-time watermarking and end-to-end encryption.',
          'Associated with Google Developer Experts.'
        ],
        links: []
      },
      {
        title: 'Autonomous Urban Response Agent (AURA)',
        image: '/images/portfolio/AURA.png',
        alt: 'AURA Project',
        pills: ['JavaScript', 'React.js', 'Node.js', 'OpenAI API', 'MERN Stack'],
        bullets: [
          'Project AURA: An autonomous, AI-driven disaster response system built for speed and survival.',
          'Features a Tri-Agent backend for intelligent emergency routing and a brutalist React PWA.',
          'Includes a Twilio-powered offline bridge that allows citizens to coordinate rescues via SMS/WhatsApp when the internet drops.'
        ],
        links: [
          {
            label: 'Live Site',
            url: 'https://hackarena-aura.vercel.app/'
          }
        ]
      },
      {
        title: 'Prompteiro',
        image: '/images/portfolio/Prompteiro.png',
        alt: 'Prompteiro VS Code Extension',
        pills: ['TypeScript', 'Node.js', 'Git', 'GitHub', 'Local LLMs', 'VS Code extension API', 'ollama', 'Microsoft Visual Studio Code'],
        bullets: [
          'Designed and engineered Prompteiro, an open-source VS Code extension that enables developers to enhance and clarify AI prompts directly in their workspace using local Ollama models (such as qwen2.5-coder) and remote API gateways.',
          'Distributed via the Visual Studio Code Marketplace.'
        ],
        links: [
          {
            label: 'VS Code Marketplace',
            url: 'https://marketplace.visualstudio.com/items?itemName=prompteiro.prompteiro'
          }
        ]
      },
      {
        title: 'Developer Portfolio (This Portfolio)',
        image: '/images/portfolio/devoloper-portfolio.png',
        alt: 'Pacman Portfolio',
        pills: ['Astro', 'TypeScript', 'Pixi.js', 'Vite', 'Sass', 'HTML5', 'CSS3'],
        bullets: [
          'Designed and developed this interactive, retro Pacman-themed developer portfolio.',
          'Features a procedurally generated widescreen maze, responsive canvas platformer mechanics using PixiJS, and dynamic AI-controlled ghosts.',
          'Engineered smooth client-side transitions and seamless subpage loading using Astro.'
        ],
        links: [
          {
            label: 'Live Site',
            url: '#'
          }
        ]
      },
    ]
  },
  {
    title: 'Experience',
    items: [
      {
        title: 'Core Member',
        image: '',
        alt: 'Microsoft Student Society UEMK',
        pills: ['Project Management'],
        bullets: [
          'Jun 2026 - Present (Kolkata, West Bengal, India - Hybrid).',
          'Microsoft Student Society UEMK - Full-time.',
          'Coordinate tech event workflows, project planning, and student developer initiatives.'
        ],
        links: []
      },
      {
        title: 'AI/ML Intern',
        image: '',
        alt: 'Innovation and Entrepreneurship Development Cell',
        pills: ['Artificial Intelligence (AI)', 'Machine Learning', 'Generative AI for Web Developers', 'App Development'],
        bullets: [
          'May 2026 - Present (Kolkata, West Bengal, India - Hybrid).',
          'Innovation and Entrepreneurship Development Cell (Dept. of CSE IoT, CS & BT), UEM, Kolkata - Internship.',
          'Developed AI educational models and integrated the Multi-Agent Educational System (MAES).'
        ],
        links: []
      },
      {
        title: 'Creator-Prompteiro Extension & Open source Contributor',
        image: '',
        alt: 'Prompteiro VSCode Extension',
        pills: ['TypeScript', 'Node.js', 'Git', 'GitHub', 'Local LLMs', 'VS Code extension API', 'ollama', 'Microsoft Visual Studio Code'],
        bullets: [
          'May 2026 - Present (Kolkata, West Bengal, India - Remote).',
          'VSCode Chrome Extension Devtools - Self-employed.',
          'Designed and engineered Prompteiro, an open-source VS Code extension that enables developers to enhance and clarify AI prompts directly in their workspace using local Ollama models (such as qwen2.5-coder) and remote API gateways.'
        ],
        links: [
          {
            label: 'VS Code Marketplace',
            url: 'https://marketplace.visualstudio.com/items?itemName=prompteiro.prompteiro'
          }
        ]
      },
      {
        title: 'Web Development Lead & Developer',
        image: '',
        alt: 'Ignitia Web Lead',
        pills: ['TypeScript', 'React.js'],
        bullets: [
          'Ignitia - Full-time (Kolkata, West Bengal, India - Hybrid).',
          'Web Development Lead: Jul 2026 - Present.',
          'Web Developer: May 2026 - Jul 2026.',
          'Designed and launched the portal for IGNITIA \'26 - a multi-domain event by the IEM-UEM group, UEM Kolkata.'
        ],
        links: []
      },
      {
        title: 'Solution Challenge 2026',
        image: '',
        alt: 'Google GDE',
        pills: ['JavaScript', 'Python'],
        bullets: [
          'Mar 2026 - Apr 2026 (Kolkata, West Bengal, India - Hybrid).',
          'Google Developer Experts - Part-time.',
          'Joined the Solution Challenge 2026 India to build tech solutions solving real-world community problems.'
        ],
        links: []
      },
      {
        title: 'Open Source Contributor',
        image: '',
        alt: 'Google Summer of Code',
        pills: ['TypeScript', 'Node.js', 'Git', 'GitHub'],
        bullets: [
          'Mar 2025 - Sep 2025 (Remote).',
          'Google Summer of Code - Part-time.',
          'Contributed to core JavaScript libraries and open-source system tools.'
        ],
        links: []
      }
    ]
  }
];

export const portfolioLogos = {
  img: '/images/logos_map.png',
  imgWide: '/images/logos_map_wide.png',
  alt: 'Portfolio logos map',
};
