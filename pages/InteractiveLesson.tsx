import React from 'react';
import { useParams } from 'react-router-dom';
import { InteractiveLessonViewer } from '../components/interactive/InteractiveLessonViewer';
import { useAuth } from '../components/ProtectedRoute';

const InteractiveLesson: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (!id) {
    return <div className="text-center text-red-500 p-8">Lesson ID is missing.</div>;
  }
  
  if (!user) {
      return <div className="text-center text-yellow-500 p-8">Please log in to view this lesson.</div>
  }

  return (
    <div>
      <InteractiveLessonViewer lessonId={id} />
    </div>
  );
};

export default InteractiveLesson;