/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { GetServerSidePropsContext } from 'next';
import imageUrlBuilder from '@sanity/image-url';
import BlockContent from '@sanity/block-content-to-react';
import styled from 'styled-components';
import BlogLayout from '@components/blogLayout';
import PageHead from '@components/pageHead';

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
    height: 40px;
    width: 40px;
    border-radius: 100px;
    margin-right: 15px;
  }

  .dates {
    font-size: 14px;
  }
`;

const StyledBlogContent = styled.div`
  margin: 0 auto;
  max-width: 800px;

  ul {
    list-style: inside;
    margin-left: 20px;

    li {
      list-style-type: disc;
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-bottom: 20px 0;
  }

  p {
    text-indent: 50px;
    line-height: 30px;
    text-align: justify;
    letter-spacing: 1.2px;
    margin-bottom: 30px;
  }

  .end {
    margin-bottom: 200px;
  }
`;

interface SinglePostProps {
  title: string;
  body: any;
  image: any;
  slug: string;
  createdAt: string;
  updatedAt: string;
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
  slug,
  createdAt,
  updatedAt,
}) => {
  const [imageUrl, setImageUrl] = useState<any>('');
  const [postSeo, setPostSeo] = useState<any>({});

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
    <>
      <PageHead
        seo={{
          title: `Zomer Gregorio | Blog | ${title}`,
          description: title as string,
          image: imgUrl as string,
          twitterUsername: '@zomeru_sama',
          url: `https://zomer.xyz/blog/${slug}`,
        }}
      />
      <BlogLayout isHome={isHome} theme={theme} toggleTheme={toggleTheme}>
        <StyledBlogHero imgUrl={imgUrl}>
          <div className='title-container'>
            <h1 className='blog-title'>{title}</h1>
            <div className='author'>
              <img
                className='author-image'
                src='https://raw.githubusercontent.com/zomeru/zomeru/main/me.png'
                alt='author image'
              />

              <p className='dates'>
                <span>Zomer Gregorio</span> |{' '}
                <span>created: {new Date(createdAt).toLocaleString()}</span> |
                <span> modified: {new Date(updatedAt).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </StyledBlogHero>

        <StyledBlogContent>
          <BlockContent blocks={body} />
          <div className='end' />
        </StyledBlogContent>
      </BlogLayout>
    </>
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

  console.log('POST', post);

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
        createdAt: post._createdAt,
        updatedAt: post._updatedAt,
        slug: post.slug,
      },
    };
  }
}
