export interface OnboardingStepProps {
	currentStep: number;
	result?: any;
	onStepChange: (step: number) => void;
	onComplete: () => void;
	onToggleAccordion: (section: string) => void;
	expandedAccordion: string;
}

export interface UploadAreaProps {
	onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	fileMeta: FileMeta | null;
	onRemoveFile: () => void;
}

export interface FileMeta {
	name: string;
	size: string;
}

export interface SideSelectionProps {
	selectedSide: string;
	onSideChange: (side: string) => void;
}

export interface OnboardingLayoutProps {
	children: React.ReactNode;
	pdfUrl: string | null;
	fileMeta: FileMeta | null;
	currentStep?: any;
}

export interface PDFPreviewProps {
	pdfUrl: string | null;
	fileMeta: FileMeta | null;
}
