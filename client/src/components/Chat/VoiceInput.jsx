import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceInput = ({ isRecording, isTranscribing, onStart, onStop }) => {
  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <span className="absolute w-10 h-10 rounded-full bg-red-500/30 voice-pulse" />
      )}
      <button
        onClick={handleClick}
        disabled={isTranscribing}
        className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-[#3f3f3f] hover:bg-[#4a4a4a] text-gray-300'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isTranscribing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={16} />
        ) : (
          <Mic size={16} />
        )}
      </button>
    </div>
  );
};

export default VoiceInput;
