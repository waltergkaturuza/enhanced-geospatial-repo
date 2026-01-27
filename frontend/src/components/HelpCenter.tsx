import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Book, Search, MessageCircle, FileText, Download, Upload, 
  Map, BarChart, Settings, HelpCircle, ChevronRight, Mail
} from 'lucide-react';

export const HelpCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const helpTopics = [
    {
      category: 'Getting Started',
      icon: <Book className="h-6 w-6" />,
      articles: [
        { title: 'How to Request Access', link: '#request-access' },
        { title: 'Understanding Roles and Permissions', link: '#roles' },
        { title: 'Your First Data Download', link: '#first-download' },
        { title: 'Subscription Plans Explained', link: '#subscriptions' },
      ]
    },
    {
      category: 'Data Access',
      icon: <Download className="h-6 w-6" />,
      articles: [
        { title: 'Browsing the Satellite Catalog', link: '#browse-catalog' },
        { title: 'Searching by Area of Interest', link: '#aoi-search' },
        { title: 'Downloading Satellite Imagery', link: '#download-imagery' },
        { title: 'Understanding Data Formats', link: '#data-formats' },
        { title: 'Download Quotas and Limits', link: '#quotas' },
      ]
    },
    {
      category: 'Analytics & Processing',
      icon: <BarChart className="h-6 w-6" />,
      articles: [
        { title: 'Running NDVI Analysis', link: '#ndvi' },
        { title: 'Custom Index Calculations', link: '#custom-indices' },
        { title: 'Batch Processing Jobs', link: '#batch-processing' },
        { title: 'Understanding Processing Status', link: '#processing-status' },
      ]
    },
    {
      category: 'Account & Billing',
      icon: <Settings className="h-6 w-6" />,
      articles: [
        { title: 'Managing Your Profile', link: '#profile' },
        { title: 'Viewing Invoices', link: '#invoices' },
        { title: 'Upgrading Your Subscription', link: '#upgrade' },
        { title: 'Payment Methods', link: '#payment' },
        { title: 'Cancellation Policy', link: '#cancellation' },
      ]
    },
    {
      category: 'For Staff Only',
      icon: <Upload className="h-6 w-6" />,
      articles: [
        { title: 'Uploading Satellite Data', link: '#upload-data' },
        { title: 'File Organization Best Practices', link: '#file-org' },
        { title: 'Approving User Requests', link: '#approve-users' },
        { title: 'Managing Subscriptions', link: '#manage-subs' },
        { title: 'Creating Invoices', link: '#create-invoices' },
      ]
    },
  ];

  const faqs = [
    {
      question: 'How long does approval take?',
      answer: 'Access requests are typically reviewed within 1-2 business days. You will receive an email notification once your account is approved.'
    },
    {
      question: 'Can I upload my own satellite imagery?',
      answer: 'No, this is a curated data repository. Only staff members can upload satellite data to ensure quality and consistency. Users download pre-validated datasets.'
    },
    {
      question: 'What satellite data is available?',
      answer: 'We provide access to Sentinel-1, Sentinel-2, Landsat 8/9, and MODIS imagery covering Zimbabwe and surrounding regions. Data is updated regularly.'
    },
    {
      question: 'How do download quotas work?',
      answer: 'Each subscription tier has monthly download limits (e.g., 50GB for Educational, 500GB for Government). Quotas reset monthly and can be upgraded if needed.'
    },
    {
      question: 'Can I request custom processing?',
      answer: 'Yes! Users with Analyst or Business tier can submit custom job requests through the Support Request system. Our team will provide quotes for custom analysis.'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-blue-100 text-lg mb-8">
            Find answers, learn how to use the platform, and get support
          </p>
          
          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/support/new"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-blue-500"
          >
            <MessageCircle className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit a Request</h3>
            <p className="text-gray-600 text-sm">Get help from our support team</p>
          </Link>
          
          <Link
            to="/feedback"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <Mail className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Send Feedback</h3>
            <p className="text-gray-600 text-sm">Help us improve the platform</p>
          </Link>
          
          <a
            href="mailto:support@geospatial-repo.gov.zw"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <HelpCircle className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h3>
            <p className="text-gray-600 text-sm">Email us directly</p>
          </a>
        </div>

        {/* Help Topics */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Browse by Topic</h2>
          
          {helpTopics.map((topic, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="text-blue-600 mr-3">{topic.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900">{topic.category}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topic.articles.map((article, idx) => (
                  <a
                    key={idx}
                    href={article.link}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-gray-700 group-hover:text-blue-600">{article.title}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="bg-white rounded-xl shadow-md p-6 group">
                <summary className="cursor-pointer font-semibold text-gray-900 flex items-center justify-between">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
          <p className="text-blue-100 mb-6">
            Our support team is here to assist you
          </p>
          <Link
            to="/support/new"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Submit a Support Request
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
