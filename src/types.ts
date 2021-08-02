export interface INavLinks {
  name: string;
  url: string;
}

export interface ISeo {
  title: string;
  description: string;
  image: StaticImageData;
  url: string;
}

export interface IProjects {
  name: string;
  images: {
    img1: StaticImageData;
    img2: StaticImageData;
    alt1: string;
    alt2: string;
  };
  info: string;
  techs: string[];
  links: {
    demo: string;
    github: string;
  };
}
