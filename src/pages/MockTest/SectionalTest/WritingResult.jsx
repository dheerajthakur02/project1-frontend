/* eslint-disable react/prop-types */
import React from 'react';
import ScoreBreakdownTable from '../FullMockTest/ScoreBreakdownTable';

function WritingResultScreen({ resultData }) {
  if (!resultData) return <div className="p-10 text-center">Loading results...</div>;

  const breakdownData = {
    writing: {
      answers: resultData.scores.map(s => ({
        type: s.questionType,
        score: s.score || 0,
        maxScore: s.maxScore || 90
      }))
    }
  };

  return (
    <div className="bg-[#f4f7f8] min-h-screen pb-10">
      <div className="bg-white border-b p-8 mb-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Writing Section Result</h1>
          <div className="text-4xl font-bold text-[#008199]">{resultData.overallScore} <span className="text-lg text-gray-500">/ 90</span></div>
        </div>
      </div>
      <ScoreBreakdownTable result={breakdownData} />
    </div>
  );
}

export default WritingResultScreen;