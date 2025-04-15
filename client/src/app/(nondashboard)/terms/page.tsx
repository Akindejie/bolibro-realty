'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import FooterSection from '../landing/FooterSection';

const Terms = () => {
  return (
    <div>
      <Navbar />
      <main className="pt-10 md:pt-16 pb-16 px-4 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>

          <div className="mb-8">
            <p className="text-gray-700 mb-4">
              Last Updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-gray-700 mb-4">
              Welcome to Bolibro Realty. Please read these Terms of Service
              (&quot;Terms&quot;) carefully as they contain important
              information regarding your legal rights, remedies, and
              obligations.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 mb-3">
                By accessing or using the Bolibro Realty website
                (&quot;Site&quot;), you agree to comply with and be bound by
                these Terms. If you do not agree to these Terms, please do not
                use our Site.
              </p>
              <p className="text-gray-700">
                We reserve the right to change these Terms at any time. Your
                continued use of the Site following the posting of changes will
                mean that you accept and agree to the changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                2. Use of the Site
              </h2>
              <p className="text-gray-700 mb-3">
                You agree to use the Site only for lawful purposes and in a way
                that does not infringe the rights of, restrict, or inhibit
                anyone else&apos;s use and enjoyment of the Site.
              </p>
              <p className="text-gray-700">
                Prohibited behavior includes harassing or causing distress or
                inconvenience to any person, transmitting obscene or offensive
                content, or disrupting the normal flow of dialogue within the
                Site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                3. Property Listings and Information
              </h2>
              <p className="text-gray-700 mb-3">
                While we strive to provide accurate property information, we
                cannot guarantee that all details are complete or correct. All
                property details, including prices, availability, and amenities,
                are subject to change without notice and should be independently
                verified.
              </p>
              <p className="text-gray-700">
                Images of properties are intended to give a general idea of the
                type of property being represented. Specific properties may vary
                from the images shown.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                4. Intellectual Property
              </h2>
              <p className="text-gray-700 mb-3">
                All content on this Site, including text, graphics, logos,
                images, and software, is the property of Bolibro Realty or its
                content suppliers and is protected by United States and
                international copyright laws.
              </p>
              <p className="text-gray-700">
                You may not reproduce, modify, distribute, or republish
                materials contained on this Site without prior written consent
                from Bolibro Realty.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                5. User Accounts
              </h2>
              <p className="text-gray-700 mb-3">
                Certain features of the Site may require registration for an
                account. You are responsible for maintaining the confidentiality
                of your account information and for all activities that occur
                under your account.
              </p>
              <p className="text-gray-700">
                You agree to notify us immediately of any unauthorized use of
                your account or any other breach of security. Bolibro Realty
                will not be liable for any loss that you may incur as a result
                of someone else using your password or account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                6. Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-3">
                To the fullest extent permitted by law, Bolibro Realty shall not
                be liable for any direct, indirect, incidental, special,
                consequential, or punitive damages, or any loss of profits or
                revenues, whether incurred directly or indirectly, or any loss
                of data, use, goodwill, or other intangible losses.
              </p>
              <p className="text-gray-700">
                This limitation applies to (a) your use or inability to use the
                Site; (b) any conduct or content of any third party on the Site;
                (c) any content obtained from the Site; and (d) unauthorized
                access, use, or alteration of your transmissions or content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                7. Indemnification
              </h2>
              <p className="text-gray-700">
                You agree to defend, indemnify, and hold harmless Bolibro
                Realty, its officers, directors, employees, and agents, from and
                against any claims, damages, obligations, losses, liabilities,
                costs or debt, and expenses arising from: (a) your use of and
                access to the Site; (b) your violation of any term of these
                Terms; (c) your violation of any third-party right, including
                without limitation any copyright, property, or privacy right.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                8. Governing Law
              </h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance
                with the laws of the State of Ohio, without regard to its
                conflict of law provisions. You agree to submit to the personal
                and exclusive jurisdiction of the courts located within
                Cleveland, Ohio for the resolution of any disputes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                9. Contact Information
              </h2>
              <p className="text-gray-700">
                If you have any questions about these Terms, please contact us
                at{' '}
                <a
                  href="mailto:info@bolibrorealty.com"
                  className="text-primary hover:underline"
                >
                  info@bolibrorealty.com
                </a>{' '}
                or by phone at +1 (513) 818-7741.
              </p>
            </section>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default Terms;
