import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Service Agreement</h2>
              <p>By using iUnlockExpert's services, you agree to these terms and conditions. Our unlocking service is provided on an "as is" basis, and while we strive for 100% success, results may vary based on device condition and carrier restrictions.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Service Delivery</h2>
              <p>While we aim to deliver within the stated timeframes, actual processing times may vary. You will receive unlock instructions via the email provided during order placement. We are not responsible for delays caused by incorrect information submission.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Device Requirements</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Device must not be reported lost or stolen</li>
                <li>Device must not be blocked by the carrier due to unpaid bills</li>
                <li>IMEI must be valid and match the device being unlocked</li>
                <li>Device must not be already unlocked</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Refund Policy</h2>
              <p>We offer a 100% money-back guarantee if we cannot unlock your device. Refund requests must be submitted within 30 days of purchase. Refunds will be processed using the original payment method.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Privacy & Data Protection</h2>
              <p>We collect and process personal data in accordance with our Privacy Policy. Your IMEI and contact information are used solely for providing the unlocking service and will not be shared with third parties except as required to complete the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Warranty & Support</h2>
              <p>Our unlocking service is permanent and survives software updates. We provide technical support for 60 days after service delivery. The warranty does not cover physical damage or software modifications made to the device.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Legal Compliance</h2>
              <p>Our unlocking methods comply with all applicable laws and regulations. We do not unlock devices that are reported stolen or involved in fraudulent activities.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Service Limitations</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>We cannot remove iCloud locks or bypass device security features</li>
                <li>Success rates may vary based on device model and carrier</li>
                <li>Some features may remain carrier-locked after unlocking</li>
                <li>We reserve the right to refuse service for any reason</li>
              </ul>
            </section>

            <section>
  <h2 className="text-xl font-semibold mb-6">Contact Support</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-gray-100 p-5 rounded-lg flex items-center space-x-4">
      <Mail className="w-10 h-10 text-blue-600" />
      <div>
        <h3 className="font-medium mb-2">Email Support</h3>
        <a 
          href="mailto:support@iunlockexpert.com" 
          className="text-gray-700 hover:text-blue-600 transition-colors"
        >
          support@iunlockexpert.com
        </a>
      </div>
    </div>
    
    <div className="bg-gray-100 p-5 rounded-lg flex items-center space-x-4">
      <MessageSquare className="w-10 h-10 text-green-600" />
      <div>
        <h3 className="font-medium mb-2">WhatsApp Support</h3>
        <a 
          href="https://wa.me/15793860596" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-green-600 transition-colors"
        >
          +1 (579) 386-0596
        </a>
      </div>
    </div>
  </div>
</section>

          </div>

          <div className="mt-8 pt-6 border-t text-sm text-gray-500">
            <p>Last updated: March 15, 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}
