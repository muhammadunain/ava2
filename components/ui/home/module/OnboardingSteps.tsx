'use client'

import { Calendar, CheckCircle, FileText, User, ArrowRight } from "lucide-react";
import { OnboardingStepProps } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // or your preferred toast library
import DeadLinesMain from "./DeadLinesMain";
import TransactionTabs from "./TranscationTabs";
import DocumentTimelineUI from "./DocumentTimeLineUi";
import TaskListUI from "./TaskListUI";
import { Button } from "../../button";

export const OnboardingSteps: React.FC<OnboardingStepProps> = ({
  currentStep,
  onStepChange,
  onComplete,
  result,
  expandedAccordion,
  onToggleAccordion,
}) => {
  const router = useRouter();

  const steps = [
    {
      icon: Calendar,
      title: 'Timeline Review',
      description: 'Review and adjust your transaction timeline and key milestones',
      color: 'slate',
      component: () => <DeadLinesMain />,
      nextButtonText: "View Transaction Summary",
    },
    {
      icon: CheckCircle,
      title: 'Task Assignment',
      description: 'Assign tasks to team members and set up notifications',
      color: 'slate',
      component: () => <TransactionTabs />,
      nextButtonText: "Plan Your Workflow",
    },
    {
      icon: User,
      title: 'Workflow Planning',
      description: 'Plan your workflow and document timeline',
      color: 'slate',
      component: () => <DocumentTimelineUI/>,
      nextButtonText: "Let's Create Your Tasks",
    },
    {
      icon: User,
      title: 'Task Creation',
      description: 'Create and organize your task list',
      color: 'slate',
      component: () => <TaskListUI/>,
      nextButtonText: "Open Transaction File",
    },
    {
      icon: FileText,
      title: 'Final Review',
      description: 'Review all information and complete the transaction setup',
      color: 'slate',
      component: () => (
        <div className="text-center py-12">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2 text-gray-900">Almost Done!</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your transaction has been set up successfully. Review all the details and complete the setup to access your transaction dashboard.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
            <h4 className="font-medium text-gray-900 mb-3">What happens next:</h4>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Access your transaction dashboard
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Track deadlines and milestones
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Manage tasks and communications
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Generate reports and documents
              </li>
            </ul>
          </div>
        </div>
      ),
      nextButtonText: "Complete Setup",
    },
  ];

  const handleComplete = async () => {
    try {
      // Call the original onComplete function to close modal/cleanup
      onComplete();
      
      // Show success toast
      toast.success("Transaction setup completed successfully!", {
        description: "Redirecting to your opportunities dashboard...",
        duration: 2000,
      });
      
      // Small delay to show the toast, then navigate
      setTimeout(() => {
        router.push('/');
      }, 1000);
      
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (currentStep < 2 || currentStep > 5) return null;

  const stepIndex = currentStep - 2;
  const step = steps[stepIndex];
  const StepComponent = step.component;

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="mb-8 w-full">
          <StepComponent />
        </div>

        <div className="flex gap-4 justify-between">
          <Button
            onClick={() => onStepChange(currentStep - 1)}
            variant="outline"
          >
            Back
          </Button>

          <Button
            onClick={() =>
              currentStep === 5 ? handleComplete() : onStepChange(currentStep + 1)
            }
            className={`bg-slate-800 hover:bg-${step.color}-700 cursor-pointer text-white group transition-all duration-200`}
          >
            <span className="flex items-center gap-2">
              {step.nextButtonText ??
                (currentStep === 5
                  ? 'Complete Setup'
                  : `Continue to Step ${currentStep + 1}`)}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};