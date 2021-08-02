import { INavLinks, ISeo, IProjects } from './types';
import OG from './assets/images/OG.png';
import {
  zomify1,
  zomify2,
  portfolio1,
  portfolio2,
  forkify1,
  forkify2,
} from './assets/images/projects';

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

export const floatingLinks: INavLinks[] = [
  {
    name: 'linkedin',
    url: 'https://linkedin.com/in/zomergregorio',
  },
  {
    name: 'github',
    url: 'https://github.com/zomeru',
  },
  {
    name: 'instagram',
    url: 'https://instagram.com/zomerusama',
  },
];

export const skills = [
  {
    name: 'HTML5',
    color: '#e34c26',
  },
  {
    name: 'Sass',
    color: '#c69',
  },
  {
    name: 'Javascript',
    color: '#F0DB4F',
  },
  {
    name: 'Typescript',
    color: '#007acc',
  },
  {
    name: 'React.js',
    color: '#61DBFB',
  },
  {
    name: 'Tailwind CSS',
    color: 'rgb(6, 182, 212)',
  },
  {
    name: 'Node.js',
    color: '#539e43',
  },
  {
    name: 'Firebase',
    color: '#FFCB2B',
  },
  {
    name: 'Github',
    color: '#211f1f',
  },
  {
    name: 'Git',
    color: '#F1502F',
  },
];

export const seo: ISeo = {
  title: 'Zomer Gregorio',
  description:
    'Zomer Gregorio is a college student and Software Engineer based in the Philippines. React.js enthusiast and loves building beautiful, elegant and responsive web applications.',
  image: OG,
  url: 'https://zomergregorio.live/',
};

export const projects: IProjects[] = [
  {
    name: 'Zomify Colors',
    images: {
      img1: zomify1,
      img2: zomify2,
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
    },
    info: 'A color palette app inspired by Flat UI Colors.',
    techs: ['Javascript', 'Sass', 'HTML'],
    links: {
      demo: 'https://zomeru-forkify.netlify.app/',
      github: 'https://github.com/zomeru/recipe-app',
    },
  },
];
