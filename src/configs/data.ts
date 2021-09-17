import { INavLinks, ISeo, IProjects, ISocialLinks, ISkills } from './types';
import {
  AiOutlineInstagram,
  AiFillHtml5,
  AiFillGithub,
  AiFillApi,
} from 'react-icons/ai';
import { FiTwitter, FiLinkedin, FiGithub, FiFacebook } from 'react-icons/fi';
import { IoLogoSass, IoLogoLinkedin } from 'react-icons/io';
import {
  SiTypescript,
  SiTailwindcss,
  SiFirebase,
  SiJavascript,
  SiMongodb,
} from 'react-icons/si';
import { FaReact, FaNodeJs, FaGitAlt } from 'react-icons/fa';
import { zomify, zomyfile, forkify, zomy } from '../assets/images/projects';

export const navLinks: INavLinks[] = [
  {
    name: 'About',
    url: '/#about',
  },
  // {
  //   name: 'Experience',
  //   url: '#experience',
  // },
  {
    name: 'Projects',
    url: '/#projects',
  },
  {
    name: 'Contact',
    url: '/#contact',
  },
  {
    name: 'Blog',
    url: '/blog',
  },
  // {
  //   name: 'Resume',
  //   url: '/assets/resume.pdf',
  // },
];

export const floatingLinks: ISocialLinks[] = [
  {
    name: 'linkedin',
    url: '/linkedin',
    Icon: IoLogoLinkedin,
  },
  {
    name: 'github',
    url: '/github',
    Icon: AiFillGithub,
  },
  {
    name: 'instagram',
    url: '/instagram',
    Icon: AiOutlineInstagram,
  },
];

export const skills: ISkills[] = [
  {
    id: 'html',
    name: 'HTML5',
    Icon: AiFillHtml5,
  },
  {
    id: 'sass',
    name: 'Sass',
    Icon: IoLogoSass,
  },
  {
    id: 'javascript',
    name: 'Javascript',
    Icon: SiJavascript,
  },
  {
    id: 'typescript',
    name: 'Typescript',
    Icon: SiTypescript,
  },
  {
    id: 'react',
    name: 'React.js',
    Icon: FaReact,
  },
  {
    id: 'react-native',
    name: 'React Native',
    Icon: FaReact,
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    Icon: SiTailwindcss,
  },
  {
    id: 'node',
    name: 'Node.js',
    Icon: FaNodeJs,
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    Icon: SiMongodb,
  },
  {
    id: 'restapi',
    name: 'RESTful API',
    Icon: AiFillApi,
  },
  {
    id: 'firebase',
    name: 'Firebase',
    Icon: SiFirebase,
  },
  {
    id: 'github',
    name: 'Github',
    Icon: AiFillGithub,
  },
  {
    id: 'git',
    name: 'Git',
    Icon: FaGitAlt,
  },
];

export const seo: ISeo = {
  title: 'Zomer Gregorio',
  description:
    'Hi! I am Zomer Gregorio, a college student, React.js enthusiast, and freelance developer based in the Philippines. I love building beautiful, elegant and responsive web applications.',
  image:
    'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/OG.png',
  url: 'https://zomer.xyz/',
};

export const projects: IProjects[] = [
  {
    name: 'Zomify Colors',
    image: zomify,
    alt: 'Landing Page of Zomify Colors',
    info: 'A color palette app inspired by Flat UI Colors.',
    techs: ['React.js', 'Material UI'],
    links: {
      demo: 'https://zomify-colors.netlify.app/',
      github: 'https://github.com/zomeru/zoms-color-palette',
    },
  },
  {
    name: 'Zomy | URL Shortener',
    image: zomy,
    alt: 'Zomy  website',
    info: 'Zomy is a free URL shortening service',
    techs: ['Typescript', 'React.js', 'Styled Components'],
    links: {
      demo: 'https://zomy.ml/',
      github: 'https://github.com/zomeru/zomy',
    },
  },
  {
    name: 'Zomyfile',
    image: zomyfile,
    alt: 'A free file sharing web app',
    info: 'A free file sharing web app',
    techs: [
      'Typescript',
      'React.js',
      'Next.js',
      'Tailwind CSS',
      'Node.js',
      'MongoDB',
    ],
    links: {
      demo: 'https://zomyfile.ml/',
      github: 'https://github.com/zomeru/zomyfile',
    },
  },
  {
    name: 'Forkify',
    image: forkify,
    alt: 'Website of Forkify',
    info: 'Forkify is a recipe app where you can search for recipes for many different dishes.',
    techs: ['Javascript', 'Sass', 'HTML'],
    links: {
      demo: 'https://zomeru-forkify.netlify.app/',
      github: 'https://github.com/zomeru/recipe-app',
    },
  },
];

export const socialLinks: ISocialLinks[] = [
  {
    name: 'Facebook',
    url: '/facebook',
    Icon: FiFacebook,
  },
  {
    name: 'Instagram',
    url: '/instagram',
    Icon: AiOutlineInstagram,
  },
  {
    name: 'Twitter',
    url: '/twitter',
    Icon: FiTwitter,
  },
  {
    name: 'Linkedin',
    url: '/linkedin',
    Icon: FiLinkedin,
  },
  {
    name: 'Github',
    url: '/github',
    Icon: FiGithub,
  },
];
