// FIX: Import React to use JSX and React types like React.FC.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// --- Placeholder UI Components ---
// These are simplified versions. In a real app with a UI library, you'd import these.
// FIX: Added variant and size to ButtonProps to resolve type error.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: string;
    size?: string;
}

const Button: React.FC<ButtonProps> = ({ className, variant, size, ...props }) => (
  <button className={cn("px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50", className)} {...props} />
);
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("bg-white/5 rounded-lg border border-white/10", className)} {...props} />
);
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-4", className)} {...props} />
);
const Badge: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("px-2 py-1 bg-white/10 text-xs rounded", className)} {...props} />
);
const RadioGroup: React.FC<any> = ({ children, onValueChange, value, className }) => (
    <div className={className}>{React.Children.map(children, child => React.cloneElement(child, { onValueChange, selectedValue: value }))}</div>
);
const RadioGroupItem: React.FC<any> = ({ value, onValueChange, selectedValue, disabled }) => (
    <input type="radio" value={value} checked={selectedValue === value} onChange={() => onValueChange(value)} disabled={disabled} className="accent-amber-400" />
);
const Checkbox: React.FC<any> = (props) => (
    <input type="checkbox" {...props} className="accent-amber-400" />
);

// --- Component Logic ---
interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}
interface Interaction {
  id: string;
  interaction_type: string;
  // FIX: Made question_text optional to align with the SceneInteraction type from types.ts.
  question_text?: string | null;
  options: Option[];
  hint: string | null;
  points: number;
  feedback_correct: string | null;
  feedback_incorrect: string | null;
}
interface InteractionRendererProps {
  interactions: Interaction[];
  onComplete: (points: number) => void;
}
export function InteractionRenderer({ interactions, onComplete }: InteractionRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [showResult, setShowResult] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const currentInteraction = interactions[currentIndex];

  const handleSingleSelect = (interactionId: string, optionId: string) => {
    if (showResult[interactionId]) return;
    setSelectedAnswers(prev => ({ ...prev, [interactionId]: optionId }));
  };

  const handleMultiSelect = (interactionId: string, optionId: string, checked: boolean) => {
    if (showResult[interactionId]) return;
    setSelectedAnswers(prev => {
      const current = (prev[interactionId] as string[]) || [];
      if (checked) {
        return { ...prev, [interactionId]: [...current, optionId] };
      } else {
        return { ...prev, [interactionId]: current.filter(id => id !== optionId) };
      }
    });
  };
  
  const handleSubmit = (interaction: Interaction) => {
    const answer = selectedAnswers[interaction.id];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    let isCorrectResult = false;
    if (interaction.interaction_type === 'choice') {
      const correctOption = interaction.options.find(o => o.isCorrect);
      isCorrectResult = answer === correctOption?.id;
    } else if (interaction.interaction_type === 'multi_choice') {
      const correctOptions = interaction.options.filter(o => o.isCorrect).map(o => o.id);
      const selectedArray = answer as string[];
      isCorrectResult = 
        correctOptions.length === selectedArray.length &&
        correctOptions.every(id => selectedArray.includes(id));
    }
    if (isCorrectResult) {
      setTotalPointsEarned(prev => prev + interaction.points);
    }
    setShowResult(prev => ({ ...prev, [interaction.id]: true }));
  };

  const handleNext = () => {
    if (currentIndex < interactions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(totalPointsEarned);
    }
  };

  const isAnswered = (interactionId: string) => {
    const answer = selectedAnswers[interactionId];
    return answer && (typeof answer === 'string' ? answer.length > 0 : answer.length > 0);
  };
  
  const isCorrect = (interaction: Interaction) => {
    const answer = selectedAnswers[interaction.id];
    if (interaction.interaction_type === 'choice') {
      return interaction.options.find(o => o.isCorrect)?.id === answer;
    } else if (interaction.interaction_type === 'multi_choice') {
      const correctOptions = interaction.options.filter(o => o.isCorrect).map(o => o.id);
      const selectedArray = answer as string[];
      return correctOptions.length === selectedArray.length &&
        correctOptions.every(id => selectedArray.includes(id));
    }
    return false;
  };

  const renderInteraction = (interaction: Interaction) => {
    const answered = showResult[interaction.id];
    const correct = answered && isCorrect(interaction);
    return (
      <motion.div
        key={interaction.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
            <HelpCircle className="h-4 w-4" />
          </div>
          <p className="text-lg font-medium">{interaction.question_text}</p>
        </div>
        {interaction.hint && !showHint[interaction.id] && !answered && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2 bg-transparent text-gray-400"
            onClick={() => setShowHint(prev => ({ ...prev, [interaction.id]: true }))}
          >
            <Lightbulb className="h-4 w-4" />
            أظهر تلميحًا
          </Button>
        )}
        <AnimatePresence>
          {showHint[interaction.id] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
            >
              <p className="text-sm text-yellow-300 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 shrink-0" />
                {interaction.hint}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {interaction.interaction_type === 'choice' && (
          <RadioGroup
            value={selectedAnswers[interaction.id] as string || ''}
            onValueChange={(value: any) => handleSingleSelect(interaction.id, value)}
            className="space-y-2"
          >
            {interaction.options.map((option) => {
              const isSelected = selectedAnswers[interaction.id] === option.id;
              const showCorrect = answered && option.isCorrect;
              const showWrong = answered && isSelected && !option.isCorrect;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    !answered && isSelected && "border-blue-500 bg-blue-500/5",
                    !answered && !isSelected && "border-white/10 hover:border-blue-500/50",
                    showCorrect && "border-green-500 bg-green-500/10",
                    showWrong && "border-red-500 bg-red-500/10",
                    answered && "cursor-not-allowed"
                  )}
                >
                  <RadioGroupItem value={option.id} disabled={answered} />
                  <span className="flex-1">{option.text}</span>
                  {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {showWrong && <XCircle className="h-5 w-5 text-red-500" />}
                </label>
              );
            })}
          </RadioGroup>
        )}
        {interaction.interaction_type === 'multi_choice' && (
          <div className="space-y-2">
            {interaction.options.map((option) => {
              const selected = ((selectedAnswers[interaction.id] as string[]) || []).includes(option.id);
              const showCorrect = answered && option.isCorrect;
              const showWrong = answered && selected && !option.isCorrect;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    !answered && selected && "border-blue-500 bg-blue-500/5",
                    !answered && !selected && "border-white/10 hover:border-blue-500/50",
                    showCorrect && "border-green-500 bg-green-500/10",
                    showWrong && "border-red-500 bg-red-500/10",
                    answered && "cursor-not-allowed"
                  )}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked: any) => 
                      handleMultiSelect(interaction.id, option.id, checked as boolean)
                    }
                    disabled={answered}
                  />
                  <span className="flex-1">{option.text}</span>
                  {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {showWrong && <XCircle className="h-5 w-5 text-red-500" />}
                </label>
              );
            })}
          </div>
        )}
        <AnimatePresence>
          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-lg",
                correct ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {correct ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-300">
                      أحسنت! +{interaction.points} نقطة
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-red-300">
                      إجابة خاطئة
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {correct 
                  ? interaction.feedback_correct || 'إجابة صحيحة!'
                  : interaction.feedback_incorrect || `الإجابة الصحيحة: ${interaction.options.find(o => o.isCorrect)?.text}`
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-end gap-2">
          {!answered ? (
            <Button
              onClick={() => handleSubmit(interaction)}
              disabled={!isAnswered(interaction.id)}
            >
              تحقق من الإجابة
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentIndex < interactions.length - 1 ? 'السؤال التالي' : 'متابعة'}
            </Button>
          )}
        </div>
      </motion.div>
    );
  };
  return (
    <Card className="border-blue-500/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge>
            السؤال {currentIndex + 1} من {interactions.length}
          </Badge>
          <Badge>
            {totalPointsEarned} نقطة
          </Badge>
        </div>
        {currentInteraction && renderInteraction(currentInteraction)}
      </CardContent>
    </Card>
  );
}