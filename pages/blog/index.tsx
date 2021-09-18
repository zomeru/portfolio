/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import BlogLayout from '@components/blogLayout';
import PageHead from '@components/pageHead';
import imageUrlBuilder from '@sanity/image-url';
import styled from 'styled-components';
import BlogCard from '@components/blogCard';

interface BlogProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
  posts: any;
}

const StyledPostsContainer = styled.div`
  height: auto;
  margin-bottom: 60px;

  .blogcard-container {
    margin: 0 auto;
    max-width: 1290px;
    height: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-gap: 25px;

    @media only screen and (max-width: 700px) {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }
`;

const blogSeo = {
  title: 'Zomer Gregorio | Blog',
  url: 'https://zomer.xyz/blog',
  description:
    'Hi! I am Zomer Gregorio, and this my blog. Go read some articles.',
  image:
    'https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/OG.png',
  twitterUsername: '@zomeru_sama',
};

const Blog: React.FC<BlogProps> = ({ theme, toggleTheme, isHome, posts }) => {
  const [mappedPosts, setMappedPosts] = useState<any>([]);
  const [mappedImages, setMappedImages] = useState<string[]>([]);

  const imageHost = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/production/`;

  useEffect(() => {
    if (posts.length) {
      const imgBuilder = imageUrlBuilder({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string,
        dataset: 'production',
      });

      setMappedImages(
        posts.map(p => {
          return `${imgBuilder.image(p.mainImage)}`;
        })
      );

      setMappedPosts(
        posts.map(p => {
          return {
            ...p,
            mainImage: imgBuilder.image(p.mainImage).width(500).height(250),
          };
        })
      );
    }
  }, []);

  return (
    <>
      <PageHead seo={{ ...blogSeo }} />
      <BlogLayout isHome={isHome} theme={theme} toggleTheme={toggleTheme}>
        <h2 className='section-heading'>My Blog Posts</h2>
        <StyledPostsContainer>
          <div className='blogcard-container'>
            {mappedPosts.length ? (
              mappedPosts.map((p, index) => {
                let imgBaseUrl = mappedImages[index].replace('image-', '');

                if (imgBaseUrl.indexOf('png') > -1) {
                  imgBaseUrl = imgBaseUrl.replace('-png', '.png');
                } else if (imgBaseUrl.indexOf('jpg') > -1) {
                  imgBaseUrl = imgBaseUrl.replace('-jpg', '.jpg');
                } else {
                  imgBaseUrl = imgBaseUrl.replace('-jpeg', '.jpeg');
                }

                return (
                  <BlogCard
                    slug={p.slug.current}
                    thumbnail={`${imgBaseUrl}`}
                    title={p.title}
                    key={index}
                  ></BlogCard>
                );
              })
            ) : (
              <h2>No Posts Yet!</h2>
            )}
          </div>
        </StyledPostsContainer>
      </BlogLayout>
    </>
  );
};

export default Blog;

export const getServerSideProps = async pageContext => {
  const query = encodeURIComponent('*[ _type == "post" ]');
  const url = `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v1/data/query/production?query=${query}`;
  const result = await fetch(url).then(res => res.json());

  if (!result.result || !result.result.length) {
    return {
      props: {
        posts: [],
      },
    };
  } else {
    return {
      props: {
        posts: result.result,
      },
    };
  }
};
