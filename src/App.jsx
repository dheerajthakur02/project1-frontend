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

function App() {
  console.log('App: Rendering App component');
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
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
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/:id" element={<ReadAloudSession />} />
        <Route path='mock-test' element={<MockTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
