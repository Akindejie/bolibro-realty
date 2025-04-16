'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const DiscoverSection = () => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      variants={containerVariants}
      className="py-12 bg-white mb-16"
    >
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <motion.div variants={itemVariants} className="my-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            Find your Dream Property Today!
          </h2>
          <p className="text-lg sm:text-xl text-center max-w-2xl mx-auto mb-12">
            Searching for your dream property has never been easier. With our
            extensive database and user-friendly platform, you can find your
            dream property!
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16 text-center">
          {[
            {
              imageSrc: '/landing-icon-wand.png',
              title: 'Search for Properties',
              description:
                'Browse through our extensive collection of properties in your desired location.',
            },
            {
              imageSrc: '/landing-icon-calendar.png',
              title: 'Book Your Dream Property',
              description:
                "Once you've found the perfect property, easily book it online with just a few clicks.",
            },
            {
              imageSrc: '/landing-icon-heart.png',
              title: 'Enjoy your New Home',
              description:
                'Move into your new property and start enjoying your dream home.',
            },
          ].map((card, index) => (
            <motion.div key={index} variants={itemVariants}>
              <DiscoverCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const DiscoverCard = ({
  imageSrc,
  title,
  description,
}: {
  imageSrc: string;
  title: string;
  description: string;
}) => (
  <div className="px-4 py-8 shadow-lg rounded-lg bg-primary-50 md:h-72">
    <div className="bg-primary-700 p-[0.6rem] rounded-full mb-4 h-10 w-10 mx-auto">
      <Image
        src={imageSrc}
        width={30}
        height={30}
        className="w-full h-full"
        alt={title}
      />
    </div>
    <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-800">
      {title}
    </h3>
    <p className="mt-2 text-base text-gray-500">{description}</p>
  </div>
);

export default DiscoverSection;
