/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { GetServerSidePropsContext } from 'next';
import imageUrlBuilder from '@sanity/image-url';
import BlockContent from '@sanity/block-content-to-react';
import Image from 'next/image';
import styled from 'styled-components';
import BlogLayout from '@components/blogLayout';

const StyledBlogHero = styled.div`
  width: 100%;
  min-height: 200px;
  height: calc(45vw);
  max-height: 70vh;
  background-image: ${(props: { imgUrl: any }) => `url('${props.imgUrl}')`};
  background-position: center;
  background-size: cover;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 70px;

  .title-container {
    height: 60%;
    width: 60%;
    background-color: ${({ theme }) => theme.blogTitleCard};
    padding: 20px;
    display: flex;
    flex-direction: column;

    justify-content: space-evenly;

    @media only screen and (min-width: 1600px) {
      padding: 20px 50px;
    }

    @media only screen and (max-width: 768px) {
      width: 85%;
      height: 75%;
    }
  }

  .blog-title {
    font-size: clamp(27px, 5vw, 50px);
  }

  .author {
    display: flex;
    align-items: center;

    span {
      color: ${({ theme }) => theme.textSecond};
    }
  }

  .author-image {
    height: 50px;
    width: 50px;
    border-radius: 100px;
    margin-right: 15px;
  }
`;

const StyledBlogContent = styled.div`
  margin: 0 auto;
  max-width: 800px;

  h2 {
    margin-bottom: 20px;
  }

  p {
    text-indent: 50px;
    line-height: 30px;
    text-align: justify;
    letter-spacing: 1.2px;
    margin-bottom: 45px;
  }

  .end {
    margin-bottom: 200px;
  }
`;

interface SinglePostProps {
  title: any;
  body: any;
  image: any;
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const SinglePost: React.FC<SinglePostProps> = ({
  title,
  body,
  image,
  isHome,
  theme,
  toggleTheme,
}) => {
  const [imageUrl, setImageUrl] = useState<any>('');

  const imageHost = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/production/`;
  let imgBaseUrl = image.asset._ref.replace('image-', '');

  if (imgBaseUrl.indexOf('png') > -1) {
    imgBaseUrl = imgBaseUrl.replace('-png', '.png');
  } else if (imgBaseUrl.indexOf('jpg') > -1) {
    imgBaseUrl = imgBaseUrl.replace('-jpg', '.jpg');
  } else {
    imgBaseUrl = imgBaseUrl.replace('-jpeg', '.jpeg');
  }

  const imgUrl = `${imageHost}${imgBaseUrl}`;

  useEffect(() => {
    const imageBuilder = imageUrlBuilder({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string,
      dataset: 'production',
    });

    setImageUrl(imageBuilder.image(image));
  }, [image]);

  return (
    <BlogLayout isHome={isHome} theme={theme} toggleTheme={toggleTheme}>
      <StyledBlogHero imgUrl={imgUrl}>
        <div className='title-container'>
          <h1 className='blog-title'>
            This is just some really long text blah blah blah
          </h1>
          <div className='author'>
            <img
              className='author-image'
              src='https://raw.githubusercontent.com/zomeru/zomeru/main/me.png'
              alt='author image'
            />

            <p>
              <span>Zomer Gregorio</span> | <span>Some Date</span>
            </p>
          </div>
        </div>
      </StyledBlogHero>

      <StyledBlogContent>
        <BlockContent blocks={body} />
        <div className='end' />
      </StyledBlogContent>
    </BlogLayout>
  );
};

export default SinglePost;

export async function getServerSideProps(
  pageContext: GetServerSidePropsContext
) {
  const pageSlug = pageContext.query.slug;

  if (!pageSlug) {
    return {
      notFound: true,
    };
  }

  const query = encodeURIComponent(
    `*[ _type == "post" && slug.current == "${pageSlug}"  ]`
  );
  const url = `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v1/data/query/production?query=${query}`;

  const result = await fetch(url).then(res => res.json());
  const post = result.result[0];

  console.log(post);

  if (!post) {
    return {
      notFound: true,
    };
  } else {
    return {
      props: {
        title: post.title,
        body: post.body,
        image: post.mainImage,
      },
    };
  }
}
