import React, { useState } from "react";

export default function FIBDMockTest({ backendData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const questions = backendData.fibdQuestions || [];
  const [userAnswers, setUserAnswers] = useState({});

  const handleSelect = (blankIndex, value) => {
    setUserAnswers(prev => ({ ...prev, [blankIndex]: value }));
  };

  const renderContent = (content, options) => {
    // Content looks like: "The sun is [blank] and very [blank]."
    // Options: [ ["hot", "cold"], ["bright", "dim"] ]
    const parts = content.split("[blank]");
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <select 
            className="mx-1 border rounded bg-gray-50 p-1"
            onChange={(e) => handleSelect(index, e.target.value)}
          >
            <option value="">Select...</option>
            {options[index].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col">
       {/* Header same as DI */}
       <div className="bg-[#008199] text-white px-6 py-2 text-[13px]">
         Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.
       </div>

       <div className="flex-grow p-12 bg-[#f9f9f9]">
          <div className="max-w-5xl mx-auto bg-white p-10 border text-lg leading-loose shadow-sm">
             {renderContent(questions[currentIdx].fullText, questions[currentIdx].options)}
          </div>
       </div>
       
       {/* Footer same as DI */}
    </div>
  );
}