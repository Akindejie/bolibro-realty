'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import FooterSection from '../landing/FooterSection';

const Privacy = () => {
  return (
    <div>
      <Navbar />
      <main className="pt-10 md:pt-16 pb-16 px-4 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Privacy Policy
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
              At Bolibro Realty, we are committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website or use our
              services.
            </p>
            <p className="text-gray-700">
              Please read this Privacy Policy carefully. By accessing or using
              our website, you acknowledge that you have read, understood, and
              agree to be bound by all the terms of this Privacy Policy.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                1. Information We Collect
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may collect personal information that you voluntarily
                  provide when using our website, such as when you:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Complete forms or create an account</li>
                  <li>Request information about properties</li>
                  <li>Apply for a rental property</li>
                  <li>Contact us with inquiries</li>
                  <li>Subscribe to our newsletter</li>
                </ul>
                <p>
                  This information may include your name, email address, phone
                  number, mailing address, financial information (for rental
                  applications), and any other information you choose to
                  provide.
                </p>
                <p>
                  We may also automatically collect certain information when you
                  visit our website, including your IP address, browser type,
                  operating system, referring URLs, and information about your
                  usage of our website.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                2. How We Use Your Information
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may use the information we collect for various purposes,
                  including to:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process rental applications and payments</li>
                  <li>Respond to your inquiries and requests</li>
                  <li>
                    Send you updates about properties that match your criteria
                  </li>
                  <li>
                    Send administrative information, such as updates to our
                    terms, conditions, and policies
                  </li>
                  <li>
                    Conduct research and analysis to better understand how users
                    access and use our website
                  </li>
                  <li>
                    Prevent fraudulent transactions, monitor against theft, and
                    protect against criminal activity
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                3. Sharing Your Information
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may share your information in the following situations:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>
                    With service providers who perform services on our behalf,
                    such as payment processing, data analysis, email delivery,
                    and hosting services
                  </li>
                  <li>
                    With property owners or managers for properties you have
                    expressed interest in renting
                  </li>
                  <li>
                    To comply with legal obligations, such as responding to
                    subpoenas, court orders, or legal process
                  </li>
                  <li>To protect and defend our rights and property</li>
                  <li>With your consent or at your direction</li>
                </ul>
                <p>
                  We do not sell, rent, or trade your personal information to
                  third parties for their marketing purposes without your
                  explicit consent.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                4. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 mb-3">
                We may use cookies, web beacons, and other tracking technologies
                to collect information about your browsing activities on our
                website. These technologies help us analyze web traffic,
                customize our services, and understand how you use our website.
              </p>
              <p className="text-gray-700">
                You can set your browser to refuse all or some browser cookies,
                or to alert you when cookies are being sent. However, if you
                disable or refuse cookies, some parts of our website may be
                inaccessible or not function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                5. Data Security
              </h2>
              <p className="text-gray-700 mb-3">
                We implement appropriate technical and organizational measures
                to protect the security of your personal information. However,
                please be aware that no method of transmission over the Internet
                or method of electronic storage is 100% secure.
              </p>
              <p className="text-gray-700">
                While we strive to use commercially acceptable means to protect
                your personal information, we cannot guarantee its absolute
                security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                6. Your Privacy Rights
              </h2>
              <p className="text-gray-700 mb-3">
                Depending on your location, you may have certain rights
                regarding your personal information, such as:
              </p>
              <ul className="list-disc ml-6 text-gray-700 space-y-1 mb-3">
                <li>
                  The right to access the personal information we have about you
                </li>
                <li>
                  The right to request that we correct or update your personal
                  information
                </li>
                <li>
                  The right to request that we delete your personal information
                </li>
                <li>The right to opt out of marketing communications</li>
              </ul>
              <p className="text-gray-700">
                To exercise your rights, please contact us using the information
                provided at the end of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                7. Children&apos;s Privacy
              </h2>
              <p className="text-gray-700">
                Our website is not directed to children under the age of 18, and
                we do not knowingly collect personal information from children
                under 18. If we learn that we have collected personal
                information from a child under 18, we will promptly take steps
                to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                8. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700">
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last Updated&quot; date. You
                are advised to review this Privacy Policy periodically for any
                changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                9. Contact Us
              </h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please
                contact us at{' '}
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

export default Privacy;
