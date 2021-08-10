import { IconType } from 'react-icons/lib';

export interface INavLinks {
  name: string;
  url: string;
}

export interface ISkills {
  id: string;
  name: string;
  Icon: IconType;
}

export interface ISeo {
  title: string;
  description: string;
  image: string | StaticImageData;
  url: string;
  gsv: string;
}

export interface IProjects {
  name: string;
  image: string;
  info: string;
  techs: string[];
  links: {
    demo: string;
    github: string;
  };
}

export interface ISocialLinks {
  name: string;
  url: string;
  Icon: IconType;
}
