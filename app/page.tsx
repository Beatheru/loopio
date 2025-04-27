"use client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { formatSeconds, isValidYoutubeVideoID } from "@/lib/utils";
import { CircleX, Repeat } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { Options, YouTubePlayer } from "youtube-player/dist/types";

const YOUTUBE_REGEX =
  /^(?:(?:http(?:s)?):\/\/)?(?:(?:www|m)\.)?(?:youtube\.com|youtu.be)\/watch\?v=?([\w\-]{11})(?:\S+)?$/;

const Home = () => {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [inputError, setInputError] = useState<string>("");
  const [speed, setSpeed] = useState(1.0);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const animationRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const endRef = useRef<number>(0);

  const opts: Options = {
    height: "100%",
    width: "100%",
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 1,
      fs: 0,
      iv_load_policy: 3,
    },
  };

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    playerRef.current.pauseVideo();
    const duration = playerRef.current.getDuration();
    setVideoDuration(duration);
    setEnd(duration);

    setInterval(() => {
      const currentTime = playerRef.current!.getCurrentTime();
      setProgress((currentTime! / duration) * 100);
    }, 50);
  };

  const onStateChange = (event: YouTubeEvent<number>) => {
    console.debug(event.data);
    switch (event.data) {
      case PlayerStates.PLAYING:
        animationRef.current = requestAnimationFrame(checkLoop);
        break;
      case PlayerStates.PAUSED:
        cancelAnimationFrame(animationRef.current);
        break;
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setInputError("");

    if (isValidYoutubeVideoID(input)) {
      setVideoId(input);
      return;
    }

    const match = input.match(YOUTUBE_REGEX);

    if (match && isValidYoutubeVideoID(match[1])) {
      setVideoId(match[1]);
      return;
    }

    setInputError("Invalid Youtube URL or Video ID");
  };

  const checkLoop = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();

      if (currentTime >= endRef.current) {
        playerRef.current.seekTo(startRef.current, true);
      }

      requestAnimationFrame(checkLoop);
    }
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(start, true);
    }

    startRef.current = start;
  }, [start]);

  useEffect(() => {
    endRef.current = end;
  }, [end]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
    }
  }, [speed]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <label>Youtube URL or Video ID</label>
        <input
          type="text"
          defaultValue={videoId}
          onChange={onInputChange}
          className="rounded-md bg-white p-2 text-black"
        />
        <div className="text-red-500">{inputError}</div>
      </div>

      <YouTube
        className="mb-10 h-3/5 w-3/4"
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
      />

      <div className="relative flex w-3/4 flex-col justify-center">
        <Slider
          value={[start, end]}
          max={videoDuration}
          step={1}
          minStepsBetweenThumbs={1}
          onValueChange={(value: number[]) => {
            setStart(value[0]);
            setEnd(value[1]);

            console.debug("Start and end:", value);
          }}
          className="absolute z-10"
          tooltipFormat={formatSeconds}
        />

        <Progress value={progress} className="h-2" />
      </div>

      <div className="mt-10 flex w-full justify-evenly">
        <div className="flex flex-col items-center">
          <Button
            onClick={() => {
              const currentTime = playerRef.current?.getCurrentTime();
              if (currentTime) {
                setStart(currentTime);
              }
            }}
          >
            Set Start
          </Button>
          <div>{formatSeconds(start)}</div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              playerRef.current?.seekTo(start, true);
            }}
          >
            <Repeat /> Reloop
          </Button>
          <Button
            onClick={() => {
              setStart(0);
              setEnd(videoDuration);
            }}
          >
            <CircleX /> Clear
          </Button>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={() => {
              const currentTime = playerRef.current?.getCurrentTime();
              if (currentTime) {
                setEnd(currentTime);
              }
            }}
          >
            Set End
          </Button>
          <div>{formatSeconds(end)}</div>
        </div>
      </div>

      <div className="mt-10 flex w-1/2 flex-col items-center gap-4">
        <Slider
          value={[speed]}
          max={2}
          step={0.05}
          onValueChange={(value: number[]) => {
            setSpeed(value[0]);

            console.debug("Speed:", value);
          }}
        />
        <div>Speed: {Math.round(speed * 100)}%</div>
      </div>
    </div>
  );
};

export default Home;
