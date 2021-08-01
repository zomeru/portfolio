import { INavLinks, ISeo } from './types';

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
  image:
    'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/screenshot.png',
  url: 'https://zomergregorio.live/',
};
