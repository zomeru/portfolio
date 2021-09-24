/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { GetServerSidePropsContext } from 'next';
import imageUrlBuilder from '@sanity/image-url';
import BlockContent from '@sanity/block-content-to-react';
import Link from 'next/link';
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
  margin-top: 30px;

  .title-container {
    height: 60%;
    width: 60%;
    background-color: ${({ theme }) => theme.blogTitleCard};
    padding: 20px 20px;
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

    @media only screen and (max-width: 500px) {
      padding: 5px 10px;
    }
  }

  .blog-title {
    font-size: clamp(20px, 5vw, 50px);
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

    @media only screen and (max-width: 500px) {
      height: 30px;
      width: 30px;
    }
  }

  .dates {
    font-size: 14px;
  }
`;

const StyledBlogContent = styled.section`
  margin: 0 auto;
  max-width: 800px;
  height: auto;

  ul {
    list-style: inside;
    margin-left: 20px;
    color: ${({ theme }) => theme.textSecond};

    li {
      list-style-type: disc;

      :not(:last-child) {
        margin-bottom: 5px;
      }
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 20px 0;
  }

  ol,
  ul {
    margin-bottom: 30px;
  }

  p {
    text-indent: 50px;
    line-height: 30px;
    letter-spacing: 1px;
    margin-bottom: 30px;
    color: ${({ theme }) => theme.textSecond};

    @media only screen and (max-width: 500px) {
      line-height: normal;
    }
  }

  .end {
    margin-bottom: 200px;
  }
`;

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface SinglePostProps {
  title: string;
  body: any;
  image: any;
  slug: string;
  createdAt: string;
  updatedAt: string;
  isHome: boolean;
}

const SinglePost: React.FC<SinglePostProps> = ({
  title,
  body,
  image,
  isHome,
  slug,
  createdAt,
  updatedAt,
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

  const createDate = new Date(createdAt);
  const modifyDate = new Date(updatedAt);
  const isModified = updatedAt > createdAt;

  const newCreateDate = `${
    monthNames[createDate.getMonth()]
  } ${createDate.getDate()}, ${createDate.getFullYear()}`;
  const newModifyDate = `${
    monthNames[modifyDate.getMonth()]
  } ${modifyDate.getDate()}, ${modifyDate.getFullYear()}`;

  const dateToBeDisplayed = `${
    isModified ? `Modified: ${newModifyDate}` : `Created: ${newCreateDate}`
  }`;

  return (
    <>
      <BlogLayout
        isHome={isHome}
        title={`${title} | `}
        url={`/${slug}`}
        description={title as string}
        image={imgUrl as string}
      >
        <Link href='/blog'>
          <a className='link go-back'>{'< Go back'}</a>
        </Link>

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
                <span>Zomer Gregorio</span> | <span>{dateToBeDisplayed}</span>
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
        slug: post.slug.current,
      },
    };
  }
}
