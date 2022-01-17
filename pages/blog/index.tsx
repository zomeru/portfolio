import React, { useState, useEffect } from "react";
import BlogLayout from "@components/blogLayout";
import imageUrlBuilder from "@sanity/image-url";
import styled from "styled-components";
import BlogCard from "@components/blogCard";

interface BlogProps {
  isHome: boolean;
  images: any;
  titles: Array<string>;
  slugs: Array<string>;
}

const StyledPostsContainer = styled.section`
  height: calc(100vh - (200px));

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

const Blog: React.FC<BlogProps> = ({ isHome, images, titles, slugs }) => {
  const [mappedImages, setMappedImages] = useState<string[]>([]);

  useEffect(() => {
    if (images.length) {
      const imgBuilder = imageUrlBuilder({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string,
        dataset: "production",
      });

      setMappedImages(
        images.map((image: any) => {
          return `${imgBuilder.image(image)}`;
        })
      );
    }
  }, [images]);

  return (
    <>
      <BlogLayout
        isHome={isHome}
        title=""
        url=""
        description="Hi! I am Zomer Gregorio, and this is my blog. Go read some articles."
        image="https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/OG-blog.png"
      >
        <StyledPostsContainer>
          <h2 className="section-heading">My Blog Posts</h2>
          <div className="blogcard-container">
            {mappedImages.length ? (
              mappedImages.map((image, index) => {
                return (
                  <BlogCard
                    slug={slugs[index]}
                    thumbnail={image as string}
                    title={titles[index]}
                    key={slugs[index]}
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

export const getServerSideProps = async () => {
  const query = encodeURIComponent('*[ _type == "post" ]');
  const url = `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v1/data/query/production?query=${query}`;
  const result = await fetch(url).then((res) => res.json());

  if (!result.result || !result.result.length) {
    return {
      props: {
        posts: [],
      },
    };
  } else {
    return {
      props: {
        images: result.result.map((p: any) => p.mainImage),
        titles: result.result.map((p: any) => p.title),
        slugs: result.result.map((p: any) => p.slug.current),
      },
    };
  }
};
