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

import ProtectedAdminRoute from './components/Admin/ProtectedAdminRoute';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageVideos from './pages/Admin/ManageVideos';
import ManageBanners from './pages/Admin/ManageBanners';

import VoucherOrders from './pages/Admin/VoucherOrders';

import PracticeLimitModal from './components/PracticeLimitModal';
import FullExamRunner from './pages/MockTest/FullMockTest/FullExamRunner';
import FullMockResultPage from './pages/MockTest/FullMockTest/FullMockResultPage';
import SectionResultPage from './pages/MockTest/SectionalTest/SectionResultPage';


import PracticeHistoryPage from './pages/Dashboard/PracticeHistoryPage';
import ProfilePage from './pages/Dashboard/ProfilePage';

import Home from './pages/Home';
import Contact from './pages/Contact';
import About from './pages/About';
import ManageReadAloud from './pages/Admin/Practise/ManageReadAloud';
import ManageDescribeImage from './pages/Admin/Practise/ManageDescribeImage';
import ManageRepeatSentence from './pages/Admin/Practise/ManageRepeatSentence';
import ManageRetellLecture from './pages/Admin/Practise/ManageReTell';
import ManageShortAnswer from './pages/Admin/Practise/ManageAnsShortQuestion';
import SummarizeGroupManage from './pages/Admin/Practise/SummarizeGroupDiscussion';
import ManageRespondSituation from './pages/Admin/Practise/ManageRespondToSituation';
import ManageWriteEssay from './pages/Admin/Practise/Writing/ManageWriteEssay';
import ManageSummarizeText from './pages/Admin/Practise/Writing/ManageSummarizeText';
import ManageReadingFIBDropdown from './pages/Admin/Practise/Reading/FillInBlanks(DropDown)';
import ManageReadingMCMA from './pages/Admin/Practise/Reading/ManageReadingMCMA';
import ManageReadingMCSA from './pages/Admin/Practise/Reading/ManageReadingMCSA';
import ManageReadingFIBDragDrop from './pages/Admin/Practise/Reading/ManageReadingFIBDragDrop';
import ManageReadingReorder from './pages/Admin/Practise/Reading/ManageReadingReorder';
import ManageSST from './pages/Admin/Practise/Listening/ManageSST';
import ManageListeningMCMA from './pages/Admin/Practise/Listening/MultipleChoiceMultipleAns';
import ManageListeningMCSA from './pages/Admin/Practise/Listening/MultipleChoiceSingleAns';
import ManageHighlightSummary from './pages/Admin/Practise/Listening/HighlightInCorrectSummary';
import ManageHIW from './pages/Admin/Practise/Listening/HighlightIncorrectWord';
import ManageSelectMissingWord from './pages/Admin/Practise/Listening/SelectMissingWord';
import ManageWriteFromDictation from './pages/Admin/Practise/Listening/WriteFromDictation';
import ManageListeningFIB from './pages/Admin/Practise/Listening/FIBL';
import ManageSpeaking from './pages/Admin/MockTest/SectionalTests/Speaking';
import ManageListening from './pages/Admin/MockTest/SectionalTests/Listening';
import ManageReading from './pages/Admin/MockTest/SectionalTests/Reading';
import ManageWriting from './pages/Admin/MockTest/SectionalTests/Writing';
import ManageFullMockTest from './pages/Admin/MockTest/ManageFullMockTest';
import ManageDescribeImages from './pages/Admin/MockTest/Question Tests/DI';
import ManageSummarizeGroupDiscussions from './pages/Admin/MockTest/Question Tests/SGD';
import ManageRTSs from './pages/Admin/MockTest/Question Tests/RTS';
import ManageRepeatSentences from './pages/Admin/MockTest/Question Tests/RS';
import ManageWriteEssays from './pages/Admin/MockTest/Question Tests/WE';
import ManageRLs from './pages/Admin/MockTest/Question Tests/RA';
import ManageRLTFs from './pages/Admin/MockTest/Question Tests/RL';
import ManageSWTs from './pages/Admin/MockTest/Question Tests/SWT';
import ManageFIBRWs from './pages/Admin/MockTest/Question Tests/FIBRW';
import ManageFIBDragDrops from './pages/Admin/MockTest/Question Tests/FIBDragDrop';
import ManageSSTs from './pages/Admin/MockTest/Question Tests/SST';
import ManageFIBLs from './pages/Admin/MockTest/Question Tests/FIBL';
import ManageHIWs from './pages/Admin/MockTest/Question Tests/HIW';
import ManageROs from './pages/Admin/MockTest/Question Tests/RO';

import ManageWFDs from './pages/Admin/MockTest/Question Tests/WFD';



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
        <Route path="contact" element={<Contact />} />
        <Route path="aboutus" element={<About />} />
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
        <Route path="/profile" element={<ProfilePage />} />
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



        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedAdminRoute />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="videos" element={<ManageVideos />} />
          <Route path="banners" element={<ManageBanners />} />
          <Route path="practice/speaking/ra" element={<ManageReadAloud />} />
          <Route path="practice/speaking/rs" element={<ManageRepeatSentence />} />
          <Route path="practice/speaking/di" element={<ManageDescribeImage />} />
          <Route path="orders" element={<VoucherOrders />} />
          <Route path="practice/speaking/rl" element={<ManageRetellLecture />} />

          <Route path="practice/speaking/asq" element={<ManageShortAnswer />} />
          <Route path="practice/speaking/sgd" element={<SummarizeGroupManage />} />
          <Route path="practice/speaking/rts" element={<ManageRespondSituation />} />
          <Route path="practice/writing/we" element={<ManageWriteEssay />} />
          <Route path="practice/writing/swt" element={<ManageSummarizeText />} />
          <Route path="practice/reading/fibrw" element={<ManageReadingFIBDropdown />} />
          <Route path="practice/reading/mcma" element={<ManageReadingMCMA />} />
          <Route path="practice/reading/mcsa" element={<ManageReadingMCSA />} />
          <Route path="practice/reading/fibd" element={<ManageReadingFIBDragDrop />} />
          <Route path="practice/reading/reorder" element={<ManageReadingReorder />} />
          <Route path="practice/listening/sst" element={<ManageSST />} />

          <Route path="practice/speaking/asq" element={<ManageShortAnswer />} />
          <Route path="practice/speaking/sgd" element={<SummarizeGroupManage />} />
          <Route path="practice/speaking/rts" element={<ManageRespondSituation />} />
          <Route path="practice/writing/we" element={<ManageWriteEssay />} />
          <Route path="practice/writing/swt" element={<ManageSummarizeText />} />
          <Route path="practice/reading/fibrw" element={<ManageReadingFIBDropdown />} />
          <Route path="practice/listening/sst" element={<ManageSST />} />
          <Route path="practice/listening/hcs" element={<ManageHighlightSummary />} />
          <Route path="practice/listening/hiw" element={<ManageHIW />} />
          <Route path="practice/listening/smw" element={<ManageSelectMissingWord />} />
          <Route path="practice/listening/wfd" element={<ManageWriteFromDictation />} />
          <Route path="practice/listening/fibl" element={<ManageListeningFIB />} />


          <Route path="practice/listening/mcma" element={<ManageListeningMCMA />} />
          <Route path="practice/listening/mcsa" element={<ManageListeningMCSA />} />

          <Route path="practice/listening/mcma" element={<ManageListeningMCMA />} />
          <Route path="practice/listening/mcsa" element={<ManageListeningMCSA />} />

          <Route path='mock/sectional/listening' element={<ManageListening />} />
          <Route path='mock/sectional/speaking' element={<ManageSpeaking />} />
          <Route path='mock/sectional/reading' element={<ManageReading />} />
          <Route path='mock/sectional/writing' element={<ManageWriting />} />
          <Route path='mock/qtest/di' element={<ManageDescribeImages />} />
          <Route path='mock/qtest/sgd' element={<ManageSummarizeGroupDiscussions />} />
          <Route path='mock/qtest/rts' element={<ManageRTSs />} />
          <Route path='mock/qtest/rs' element={<ManageRepeatSentences />} />
          <Route path='mock/qtest/we' element={<ManageWriteEssays />} />
          <Route path='mock/qtest/ra' element={<ManageRLs />} />
          <Route path='mock/qtest/rl' element={<ManageRLTFs />} />
          <Route path='mock/qtest/swt' element={<ManageSWTs />} />

          <Route path='mock/full/manage' element={<ManageFullMockTest />} />
          <Route path='mock/full' element={<Navigate to="/admin/mock/full/manage" replace />} />

          {/* Question Tests */}
          <Route path='mock/qtest/fib' element={<ManageFIBRWs />} />
          <Route path='mock/qtest/fibd' element={<ManageFIBDragDrops />} />
          <Route path='mock/qtest/ro' element={<ManageROs />} />
          <Route path='mock/qtest/wfd' element={<ManageWFDs />} />
          <Route path='mock/qtest/sst' element={<ManageSSTs />} />
          <Route path='mock/qtest/fibl' element={<ManageFIBLs />} />
          <Route path='mock/qtest/hiw' element={<ManageHIWs />} />


        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;