"use client";

import { useState } from "react";
import { addReport } from "@/lib/store";

interface ReportModalProps {
  clinicId: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function ReportModal({
  clinicId,
  onClose,
  onComplete,
}: ReportModalProps) {
  const [step, setStep] = useState<"waiting" | "duration" | "confirmation">("waiting");
  const [isWaiting, setIsWaiting] = useState<boolean | null>(null);

  const handleWaitingClick = (waiting: boolean) => {
    if (waiting) {
      setIsWaiting(true);
      setStep("duration");
    } else {
      // "No, not here" - closes modal without creating report
      // Does NOT update reports, timestamps, or trigger status recalculation
      onClose();
    }
  };

  /**
   * ONLY function that creates reports.
   * Called ONLY after Step 2 completion (duration selection).
   * This is the single point of report creation.
   */
  const handleDurationClick = async (duration: "Just arrived / <15 min" | "15–30 min" | "30+ min") => {
    const success = await addReport({
      clinicId,
      isWaiting: true,
      waitDuration: duration,
    });

    if (success) {
      setStep("confirmation");
      // Auto-close after 1 second
      setTimeout(() => {
        onComplete();
      }, 1000);
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full rounded-t-2xl p-5 max-h-[60vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "waiting" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Are you at this clinic right now?
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              This updates the live status for others
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleWaitingClick(true)}
                className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 active:bg-gray-800"
              >
                Yes, waiting
              </button>
              <button
                onClick={() => handleWaitingClick(false)}
                className="w-full py-4 bg-white text-gray-900 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                No, not here
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Anonymous · No personal data collected
            </p>
          </div>
        )}

        {step === "duration" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Roughly how long have you been waiting?
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              An estimate is fine.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleDurationClick("Just arrived / <15 min")}
                className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 text-base"
              >
                Just arrived / &lt;15 min
              </button>
              <button
                onClick={() => handleDurationClick("15–30 min")}
                className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 text-base"
              >
                15–30 min
              </button>
              <button
                onClick={() => handleDurationClick("30+ min")}
                className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 text-base"
              >
                30+ min
              </button>
            </div>
          </div>
        )}

        {step === "confirmation" && (
          <div className="text-center py-6">
            <p className="text-lg text-gray-900">
              Thanks — this helps others plan better.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

