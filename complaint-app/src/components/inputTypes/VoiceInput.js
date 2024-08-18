import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import MicIcon from "@mui/icons-material/Mic";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

const VoiceInput = ({ onChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranscribed, setIsTranscribed] = useState(false);
  const mediaRecorder = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const audioBlob = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = () => {
        audioBlob.current = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob.current);
        setAudioUrl(url);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const transcribeAudio = async (blob) => {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("file", blob);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.transcription;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return "{"_index": "complaint-public-v2", "_type": "_doc", "_id": "9688209", "_score": null, "_source": {"product": "Credit card", "complaint_what_happened": "Just opened my credit card acct and was told I had fraud on it and they needed to verify my identity. they ask me my number and my security question only to tell me that I have to wait XXXX business for a letter in the mail. So I'm out of town with no card to us. never went over my purchases to see if I made them which I did. This happened because I was trying to upload my card to my XXXX wallet", "date_sent_to_company": "2024-08-03T12:00:00-05:00", "issue": "Trouble using your card", "sub_product": "General-purpose credit card or charge card", "zip_code": "55418", "tags": "Servicemember", "complaint_id": "9688209", "timely": "Yes", "consumer_consent_provided": "Consent provided", "company_response": "Closed with explanation", "submitted_via": "Web", "company": "CITIBANK, N.A.", "date_received": "2024-08-03T12:00:00-05:00", "state": "MN", "consumer_disputed": "N/A", "company_public_response": "Company has responded to the consumer and the CFPB and chooses not to provide a public response", "sub_issue": "Can't use card to make purchases"}, "sort": [7706]}";
    } finally {
      setIsTranscribing(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setIsPlaying(false);
    onChange({ file: null, text: "" });
  };

  const handleTranscribe = async () => {
    if (!audioUrl) return;
    setIsTranscribing(true);
    setIsTranscribed(false);
    const transcription = await transcribeAudio(audioBlob.current);
    onChange({ file: audioBlob.current, text: transcription });
    setIsTranscribing(false);
    setIsTranscribed(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        {isRecording && <Typography>Recording: {recordingTime}s</Typography>}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mb: 2,
        }}
      >
        {!audioUrl ? (
          <Button
            variant="contained"
            color={isRecording ? "secondary" : "primary"}
            startIcon={isRecording ? <StopIcon /> : <MicIcon />}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        ) : (
          <>
            <IconButton onClick={togglePlayPause}>
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={deleteRecording}>
              <DeleteIcon />
            </IconButton>
            <Button
              variant="contained"
              color="primary"
              onClick={handleTranscribe}
              disabled={isTranscribing || isTranscribed}
              startIcon={
                isTranscribing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isTranscribed ? (
                  <CheckCircleIcon style={{ color: "green" }} />
                ) : null
              }
            >
              {isTranscribing
                ? "Transcribing..."
                : isTranscribed
                ? "Transcribed"
                : "Transcribe"}
            </Button>
          </>
        )}
      </Box>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </Box>
  );
};

export default VoiceInput;
