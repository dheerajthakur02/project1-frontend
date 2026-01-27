import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import SignIn from './pages/SignIn/SignIn';
import PersonalDetails from './pages/PersonalDetails/PersonalDetails';
import Dashboard from './pages/Dashboard/Dashboard';
import Practice from './pages/Practice/Practice';
import SelectProduct from './pages/SelectProduct/SelectProduct';
import ReadAloudSession from './pages/Practice/ReadAloudSession';
import MockTest from './pages/MockTest/MockTest';
import SecureExamWrapper from './pages/MockTest/SecureExamWrapper';
import Pricing from './pages/Pricing/Pricing';
import BuyVouchers from './pages/BuyVouchers/BuyVouchers';

import PracticeLimitModal from './components/PracticeLimitModal';
import FullExamRunner from './pages/MockTest/FullMockTest/FullExamRunner';
import FullMockResultPage from './pages/MockTest/FullMockTest/FullMockResultPage';
import SectionResultPage from './pages/MockTest/SectionalTest/SectionResultPage';

import PracticeHistoryPage from './pages/Dashboard/PracticeHistoryPage';

import Home from './pages/Home';
import { Contact } from './pages/Contact';
import { About } from './pages/About';




function App() {
  const [showLimitModal, setShowLimitModal] = React.useState(false);

  React.useEffect(() => {
    const handleLimitReached = () => setShowLimitModal(true);
    window.addEventListener('practiceLimitReached', handleLimitReached);
    return () => window.removeEventListener('practiceLimitReached', handleLimitReached);
  }, []);


  return (
    <BrowserRouter>
      <PracticeLimitModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} />
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="contact" element={<Contact/>}/>
        <Route path="aboutus" element={<About/>}/>


        <Route path="/signin" element={<SignIn />} />
        <Route path="/select-product" element={
          <Layout currentStep={1}>
            <SelectProduct />
          </Layout>
        } />
        <Route path="/personal-details" element={
          <Layout currentStep={2}>
            <PersonalDetails />
          </Layout>
        } />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice-history" element={<PracticeHistoryPage />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/:id" element={<ReadAloudSession />} />
        <Route path='mock-test' element={<MockTest />} />

        {/* Question attempt */}
        <Route path="/question/:type" element={<SecureExamWrapper />} />
        <Route path='/pricing' element={<Pricing />} />
        <Route path='/buy-vouchers' element={<BuyVouchers />} />

        {/* Full Mock Test */}
        <Route path="/mocktest/full/:id" element={<FullExamRunner />} />
        <Route path="/mocktest/full/result/:id" element={<FullMockResultPage />} />

        {/* Section Mock Test Result */}
        <Route path="/mocktest/section/:type/result/:id" element={<SectionResultPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
