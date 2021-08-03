import { INavLinks, ISeo, IProjects, ISocialLinks, ISkills } from './types';
import {
  zomify1,
  zomify2,
  portfolio1,
  portfolio2,
  forkify1,
  forkify2,
} from './assets/images/projects';
import { AiOutlineInstagram } from 'react-icons/ai';
import { FiTwitter, FiLinkedin, FiGithub, FiFacebook } from 'react-icons/fi';
import { AiFillGithub, AiFillHtml5 } from 'react-icons/ai';
import { IoLogoSass, IoLogoLinkedin } from 'react-icons/io';
import {
  SiTypescript,
  SiTailwindcss,
  SiFirebase,
  SiJavascript,
} from 'react-icons/si';
import { FaReact, FaNodeJs, FaGitAlt } from 'react-icons/fa';

export const navLinks: INavLinks[] = [
  {
    name: 'About',
    url: '#about',
  },
  // {
  //   name: 'Experience',
  //   url: '#experience',
  // },
  {
    name: 'Projects',
    url: '#projects',
  },
  {
    name: 'Contact',
    url: '#contact',
  },
];

export const floatingLinks: ISocialLinks[] = [
  {
    name: 'linkedin',
    url: 'https://linkedin.com/in/zomergregorio',
    Icon: IoLogoLinkedin,
  },
  {
    name: 'github',
    url: 'https://github.com/zomeru',
    Icon: AiFillGithub,
  },
  {
    name: 'instagram',
    url: 'https://instagram.com/zomerusama',
    Icon: AiOutlineInstagram,
  },
];

export const skills: ISkills[] = [
  {
    name: 'HTML5',
    color: '#e34c26',
    Icon: AiFillHtml5,
  },
  {
    name: 'Sass',
    color: '#c69',
    Icon: IoLogoSass,
  },
  {
    name: 'Javascript',
    color: '#F0DB4F',
    Icon: SiJavascript,
  },
  {
    name: 'Typescript',
    color: '#007acc',
    Icon: SiTypescript,
  },
  {
    name: 'React.js',
    color: '#61DBFB',
    Icon: FaReact,
  },
  {
    name: 'Tailwind CSS',
    color: 'rgb(6, 182, 212)',
    Icon: SiTailwindcss,
  },
  {
    name: 'Node.js',
    color: '#539e43',
    Icon: FaNodeJs,
  },
  {
    name: 'Firebase',
    color: '#FFCB2B',
    Icon: SiFirebase,
  },
  {
    name: 'Github',
    color: '#211f1f',
    Icon: AiFillGithub,
  },
  {
    name: 'Git',
    color: '#F1502F',
    Icon: FaGitAlt,
  },
];

export const seo: ISeo = {
  title: 'Zomer Gregorio',
  description:
    'Zomer Gregorio is a college student and Software Engineer based in the Philippines. React.js enthusiast and loves building beautiful, elegant and responsive web applications.',
  image:
    'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/OG.png',
  url: 'https://zomergregorio.live/',
};

export const projects: IProjects[] = [
  {
    name: 'Zomify Colors',
    images: {
      img1: zomify1,
      img2: zomify2,
      alt1: 'Landing page of the website.',
      alt2: 'Custom color palette creator page.',
    },
    info: 'A color palette app inspired by Flat UI Colors.',
    techs: ['React.js', 'Material UI'],
    links: {
      demo: 'https://zomify-colors.netlify.app/',
      github: 'https://github.com/zomeru/zoms-color-palette',
    },
  },
  {
    name: 'Simple Portfolio',
    images: {
      img1: portfolio1,
      img2: portfolio2,
      alt1: 'Design of the portfolio template.',
      alt2: 'Design of the portfolio template.',
    },
    info: 'A very simple portfolio template.',
    techs: ['Typescript', 'React.js', 'Next.js', 'Tailwind CSS'],
    links: {
      demo: 'https://zomeru.vercel.app/',
      github: 'https://github.com/zomeru/portfolio-next-ts',
    },
  },
  {
    name: 'Forkify',
    images: {
      img1: forkify1,
      img2: forkify2,
      alt1: 'Design of the forkify website.',
      alt2: 'Design of the forkify website.',
    },
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
    url: 'https://facebook.com/Zomeru',
    Icon: FiFacebook,
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/zomerusama',
    Icon: AiOutlineInstagram,
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/zomeru_sama',
    Icon: FiTwitter,
  },
  {
    name: 'Linkedin',
    url: 'https://linkedin.com/in/zomergregorio',
    Icon: FiLinkedin,
  },
  {
    name: 'Github',
    url: 'https://github.com/zomeru',
    Icon: FiGithub,
  },
];
