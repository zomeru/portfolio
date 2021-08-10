import { INavLinks, ISeo, IProjects, ISocialLinks, ISkills } from './types';
import { AiOutlineInstagram, AiFillHtml5, AiFillGithub } from 'react-icons/ai';
import { FiTwitter, FiLinkedin, FiGithub, FiFacebook } from 'react-icons/fi';
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
    'Zomer Gregorio is a college student and Software Engineer based in the Philippines. React.js enthusiast and loves building beautiful, elegant and responsive web applications.',
  image:
    'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/OG.png',
  url: 'https://zomergregorio.live/',
  gsv: 'jvWN1uM-h3tiEcihL_UdVN3MvownDLRfLFOJP3pF40s',
};

export const projects: IProjects[] = [
  {
    name: 'Zomify Colors',
    image:
      'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/projects/zomify-colors-min.webp',
    info: 'A color palette app inspired by Flat UI Colors.',
    techs: ['React.js', 'Material UI'],
    links: {
      demo: 'https://zomify-colors.netlify.app/',
      github: 'https://github.com/zomeru/zoms-color-palette',
    },
  },
  {
    name: 'Simple Portfolio',
    image:
      'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/projects/simple-portfolio-min.webp',
    info: 'A very simple portfolio template.',
    techs: ['Typescript', 'React.js', 'Next.js', 'Tailwind CSS'],
    links: {
      demo: 'https://zomeru.vercel.app/',
      github: 'https://github.com/zomeru/portfolio-next-ts',
    },
  },
  {
    name: 'Forkify',
    image:
      'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/projects/forkify-min.webp',
    info: 'Forkify is a recipe app where you can search for recipes for many different dishes.',
    techs: ['Javascript', 'Sass', 'HTML'],
    links: {
      demo: 'https://zomeru-forkify.netlify.app/',
      github: 'https://github.com/zomeru/recipe-app',
    },
  },
  {
    name: 'Pig Dice Game',
    image:
      'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/projects/pig-dice-game-min.webp',
    info: 'Pig is a simple dice game which in its basic form is playable with just a single die. You win by being the first player to score 100 or more points.',
    techs: ['Javascript', 'CSS', 'HTML'],
    links: {
      demo: 'https://zomeru.github.io/pig-dice-game/',
      github: 'https://github.com/zomeru/pig-dice-game',
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
