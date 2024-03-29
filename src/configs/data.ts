import {
  INavLinks,
  IProjects,
  ISocialLinks,
  ISkills,
  CustomSeoProps,
} from "./types";
import {
  AiOutlineInstagram,
  // AiFillHtml5,
  AiFillGithub,
  AiFillApi,
  AiOutlineTeam,
  AiFillMessage,
} from "react-icons/ai";
import {
  FiTwitter,
  FiLinkedin,
  FiGithub,
  FiFacebook,
  FiFigma,
} from "react-icons/fi";
import { GiPlayerTime, GiThink } from "react-icons/gi";
import { BsArrowRepeat } from "react-icons/bs";
// import { IoLogoSass, IoLogoLinkedin } from 'react-icons/io';
import { IoLogoLinkedin } from "react-icons/io";
import { GrGraphQl } from "react-icons/gr";
import {
  SiTypescript,
  SiTailwindcss,
  SiFirebase,
  // SiJavascript,
  SiMongodb,
  SiStyledcomponents,
  SiRedux,
  SiPostgresql,
} from "react-icons/si";
import {
  FaReact,
  FaNodeJs,
  FaGitAlt,
  FaAssistiveListeningSystems,
  FaFistRaised,
  FaHandHoldingHeart,
  FaPuzzlePiece,
  FaDocker,
} from "react-icons/fa";

export const navLinks: INavLinks = {
  home: [
    {
      name: "About",
      url: "/#about",
    },
    {
      name: "Projects",
      url: "/#projects",
    },
    {
      name: "Contact",
      url: "/#contact",
    },
    {
      name: "Blog",
      url: "/blog",
    },
  ],
  otherPage: [
    {
      name: "Home",
      url: "/",
    },
    {
      name: "Blog",
      url: "/blog",
    },
  ],
};

export const floatingLinks: ISocialLinks[] = [
  {
    name: "linkedin",
    url: "/linkedin",
    Icon: IoLogoLinkedin,
  },
  {
    name: "github",
    url: "/github",
    Icon: AiFillGithub,
  },
  {
    name: "instagram",
    url: "/instagram",
    Icon: AiOutlineInstagram,
  },
];

export const skills: ISkills[] = [
  // {
  //   id: 'html',
  //   name: 'HTML5',
  //   Icon: AiFillHtml5,
  // },
  // {
  //   id: 'sass',
  //   name: 'Sass',
  //   Icon: IoLogoSass,
  // },
  // {
  //   id: 'javascript',
  //   name: 'Javascript',
  //   Icon: SiJavascript,
  // },
  {
    id: "typescript",
    name: "Typescript",
    Icon: SiTypescript,
  },
  {
    id: "react",
    name: "React.js",
    Icon: FaReact,
  },
  {
    id: "react-native",
    name: "React Native",
    Icon: FaReact,
  },
  {
    id: "redux",
    name: "Redux",
    Icon: SiRedux,
  },
  {
    id: "styled-components",
    name: "Styled-Components",
    Icon: SiStyledcomponents,
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    Icon: SiTailwindcss,
  },
  {
    id: "node",
    name: "Node.js",
    Icon: FaNodeJs,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    Icon: SiMongodb,
  },
  {
    id: "postgre",
    name: "PostgreSQL",
    Icon: SiPostgresql,
  },
  {
    id: "graphql",
    name: "GraphQL",
    Icon: GrGraphQl,
  },
  {
    id: "restapi",
    name: "REST API",
    Icon: AiFillApi,
  },
  {
    id: "firebase",
    name: "Firebase",
    Icon: SiFirebase,
  },
  {
    id: "docker",
    name: "Docker",
    Icon: FaDocker,
  },
  {
    id: "github",
    name: "Github",
    Icon: AiFillGithub,
  },
  {
    id: "git",
    name: "Git",
    Icon: FaGitAlt,
  },
  {
    id: "figma",
    name: "Figma",
    Icon: FiFigma,
  },
];

export const softSkills: ISkills[] = [
  {
    id: "teamplayer",
    name: "Team Player",
    Icon: AiOutlineTeam,
  },
  {
    id: "fast-independent",
    name: "Fast and Independent Learner",
    Icon: GiPlayerTime,
  },
  {
    id: "adaptive",
    name: "Adaptive",
    Icon: BsArrowRepeat,
  },
  {
    id: "listener",
    name: "Listener",
    Icon: FaAssistiveListeningSystems,
  },
  {
    id: "highly-motivated",
    name: "Highly Motivated",
    Icon: FaFistRaised,
  },
  {
    id: "passionate",
    name: "Passionate",
    Icon: FaHandHoldingHeart,
  },
  {
    id: "communication",
    name: "Communication",
    Icon: AiFillMessage,
  },
  {
    id: "critical-thinker",
    name: "Critical Thinker",
    Icon: GiThink,
  },
  {
    id: "problem-solver",
    name: "Problem Solver",
    Icon: FaPuzzlePiece,
  },
];

export const customSeo: CustomSeoProps = {
  description:
    "Zomer Gregorio is a Software Engineer based in the Philippines. Skilled in React, Node, TypeScript and other web technologies with 2 years of professional experience in Full Stack Development.",
  title: "Zomer Gregorio",
  image: "https://zomeru.com/assets/OG.png",
  url: "https://zomeru.com/",
  twitterUsername: "@zomeru_sama",
};

export const nextSeo = {
  title: "Zomer Gregorio",
  description:
    "Zomer Gregorio is a Software Engineer based in the Philippines. Skilled in React, Node, TypeScript and other web technologies with 2 years of professional experience in Full Stack Development.",
  canonical: "https://zomeru.com/",
  openGraph: {
    url: "https://zomeru.com/",
    title: "Zomer Gregorio",
    description:
      "Zomer Gregorio is a Software Engineer based in the Philippines. Skilled in React, Node, TypeScript and other web technologies with 2 years of professional experience in Full Stack Development.",
    images: [
      {
        url: "https://zomeru.com/assets/OG.png",
      },
    ],
    site_name: "Zomer Gregorio",
  },
  twitter: {
    handle: "@zomeru_sama",
    site: "https://zomeru.com/",
    cardType: "summary_large_image",
  },
};

export const projects: IProjects[] = [
  {
    name: "STICA LMS",
    image: "/assets/projects/project-sticalms.png",
    alt: "STICA LMS website",
    info: "STICA LMS is my capstone project for my college. It is an online library management system for STI College Alabang.",
    techs: [
      "Typescript",
      "React.js",
      "Next.js",
      "Turborepo",
      "Tailwind CSS",
      "Firebase",
      "Algolia",
    ],
    links: {
      demo: "https://sticalms.com/",
      github: "https://github.com/zomeru/stica-lms",
    },
  },
  {
    name: "Kokuban",
    image: "/assets/projects/project-kokuban.png",
    alt: "Kokuban landing page",
    info: "Kokuban is meant to assist the teachers in Japan to create online educational materials that their students can access and use from the browser.",
    techs: [
      "Typescript",
      "React.js",
      "Next.js",
      "Tailwind CSS",
      "Node.js",
      "MongoDB",
      "Firebase",
    ],
    links: {
      demo: "https://kokuban.vercel.app/",
      github: "https://github.com/Yumeville/kokuban",
    },
  },
  {
    name: "Zomink",
    image: "/assets/projects/project-zomink.png",
    alt: "Zomink  website",
    info: "Zomink is an open-source link management platform with all the features you need in one place. Manage, track, and shorten your URLs with your custom alias.",
    techs: [
      "Typescript",
      "React.js",
      "Next.js",
      "Tailwind CSS",
      "Node.js",
      "MongoDB",
    ],
    links: {
      demo: "https://zom.ink/",
      github: "https://github.com/zomeru/zomink",
    },
  },
  {
    name: "Paymongo.js",
    image: "/assets/projects/project-paymongo.png",
    alt: "NPM package for Paymongo",
    info: "A lightweight, fully-featured, modular, typescript-compatible javascript library for Paymongo.",
    techs: ["Node.js", "TypeScript", "Paymongo"],
    links: {
      demo: "https://www.npmjs.com/package/paymongo.js",
      github: "https://github.com/omsimos/paymongo.js",
    },
  },
  {
    name: "Groundwork PH",
    image: "/assets/projects/project-groundwork.png",
    alt: "An online B2B platform designed to create and gather networks for business establishments in the Philippines!",
    info: "An online B2B platform designed to create and gather networks for business establishments in the Philippines!",
    techs: [
      "Typescript",
      "React.js",
      "Next.js",
      "Tailwind CSS",
      "Firebase",
      "Paymongo",
    ],
    links: {
      demo: "https://shop.groundworkph.com/",
      github: "https://github.com/princejoogie/ground-work-ecom",
    },
  },
  {
    name: "Zomify Colors",
    image: "/assets/projects/project-zomify.png",
    alt: "Landing Page of Zomify Colors",
    info: "A color palette app inspired by Flat UI Colors.",
    techs: ["React.js", "Material UI"],
    links: {
      demo: "https://zomify-colors.netlify.app/",
      github: "https://github.com/zomeru/zoms-color-palette",
    },
  },
];

export const socialLinks: ISocialLinks[] = [
  {
    name: "Facebook",
    url: "/facebook",
    Icon: FiFacebook,
  },
  {
    name: "Instagram",
    url: "/instagram",
    Icon: AiOutlineInstagram,
  },
  {
    name: "Twitter",
    url: "/twitter",
    Icon: FiTwitter,
  },
  {
    name: "Linkedin",
    url: "/linkedin",
    Icon: FiLinkedin,
  },
  {
    name: "Github",
    url: "/github",
    Icon: FiGithub,
  },
];
