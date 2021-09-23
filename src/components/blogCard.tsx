import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

const StyledBlogCard = styled.div`
  height: 250px;
  width: 100%;
  overflow: hidden;
  position: relative;
  cursor: pointer;

  :hover .image-container {
    transform: scale(1.2);
  }

  .image-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    z-index: 1;
    transform: scale(1);
    transition: var(--transition2);
  }

  .card-title-wrapper {
    position: absolute;
    padding: 10px;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 200;
    background-color: ${({ theme }) => theme.blogTitleCard};
  }
  .card-title {
    text-align: center;
  }
`;

interface BlogCardProps {
  thumbnail: string;
  title: string;
  slug: string;
}

const BlogCard: React.FC<BlogCardProps> = ({ slug, title, thumbnail }) => {
  const router = useRouter();
  return (
    <StyledBlogCard onClick={() => router.push(`/blog/${slug}`)}>
      <div className='image-container'>
        <Image
          src={thumbnail}
          alt={title}
          layout='fill'
          objectFit='cover'
          objectPosition='center'
        />
      </div>
      <div className='card-title-wrapper'>
        <Link href={`/blog/${slug}`}>
          <a>
            <h3 className='card-title'>{title}</h3>
          </a>
        </Link>
      </div>
    </StyledBlogCard>
  );
};

export default BlogCard;
