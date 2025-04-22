'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import FooterSection from '../landing/FooterSection';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full justify-between items-center text-left"
      >
        <h3 className="text-lg font-medium text-gray-900">{question}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 text-gray-600 leading-relaxed">{answer}</div>
      )}
    </div>
  );
};

const FAQ = () => {
  const faqItems: FaqItemProps[] = [
    {
      question: 'What types of properties does Bolibro Realty offer?',
      answer:
        'Bolibro Realty specializes in rental properties tailored for healthcare professionals, students, engineers, and Section 8 tenants. We offer a diverse range of properties including apartments, townhouses, and single-family homes with various leasing options such as long-term, short-term, and mid-term rentals.',
    },
    {
      question: 'How do I schedule a property viewing?',
      answer:
        'You can schedule a property viewing by contacting our office directly at +1 (513) 818-7741, sending an email to info@bolibrorealty.com, or by using the contact form on our website. Our team will get back to you promptly to arrange a convenient time for you to view the property.',
    },
    {
      question: 'What is the application process for renting a property?',
      answer:
        "Our application process is straightforward. First, find a property you're interested in and schedule a viewing. If you decide to proceed, complete our online application form, which includes personal information, employment details, rental history, and references. We'll conduct background and credit checks. Once approved, you'll sign the lease agreement and pay the security deposit to secure the property.",
    },
    {
      question: 'Are utilities included in the rent?',
      answer:
        'Utility inclusion varies by property. Some of our rentals include certain utilities like water, trash, or even internet, while others require tenants to set up and pay for all utilities. The specific details are clearly listed in each property description and will be outlined in your lease agreement.',
    },
    {
      question: 'What is your pet policy?',
      answer:
        'Our pet policy varies by property. Many of our rentals are pet-friendly, though they may require an additional pet deposit and/or monthly pet rent. Breed and size restrictions may apply. Please check the specific property listing for pet policy details or contact our office for more information.',
    },
    {
      question: 'How do I pay my rent?',
      answer:
        'We offer several convenient payment options. Tenants can pay rent through our online portal using credit/debit cards or bank transfers, set up automatic payments, or use other methods specified in your lease agreement. Our online system provides a secure and convenient way to make payments and track your payment history.',
    },
    {
      question: 'How do I report maintenance issues?',
      answer:
        'Maintenance issues can be reported through our tenant portal, by email, or by calling our office. For emergency issues (like major leaks, electrical problems, or no heat in winter), please call our emergency maintenance line immediately. For non-emergency issues, we typically respond within 24-48 hours during business days.',
    },
    {
      question: 'What happens when my lease is ending?',
      answer:
        "Approximately 60-90 days before your lease end date, we'll contact you about your renewal options. If you wish to renew, we'll provide the new terms and rental rate. If you decide not to renew, you'll need to provide notice as specified in your lease (typically 30-60 days). We'll then schedule a move-out inspection and provide information about the security deposit return process.",
    },
    {
      question: 'Do you offer furnished properties?',
      answer:
        'Yes, some of our properties come furnished or partially furnished, particularly those designed for traveling professionals or short-term rentals. The furniture and amenities included vary by property. Please check individual property listings or contact our office for specific information about furnished options.',
    },
    {
      question: 'What security measures are in place at your properties?',
      answer:
        'Security features vary by property but may include secure entry systems, surveillance cameras in common areas, well-lit parking areas, and deadbolt locks. We take the safety of our tenants seriously and regularly review and update security measures as needed. Specific security features for each property are listed in the property description.',
    },
  ];
  return (
    <div>
      <Navbar />
      <main className="pt-10 md:pt-16 pb-16 px-4 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>

          <div className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              Find answers to the most common questions about Bolibro
              Realty&apos;s properties and services. If you can&apos;t find what
              you&apos;re looking for, please don&apos;t hesitate to{' '}
              <a href="/contact" className="text-primary hover:underline">
                contact us
              </a>
              .
            </p>
          </div>

          <div className="space-y-1">
            {faqItems.map((item, index) => (
              <FaqItem
                key={index}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Still Have Questions?
            </h2>
            <p className="text-gray-700 mb-6">
              Our team is here to help. Reach out to us for personalized
              assistance.
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default FAQ;
