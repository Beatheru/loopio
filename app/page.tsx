"use client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { formatSeconds } from "@/lib/utils";
import { CircleX, Repeat } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { Options, YouTubePlayer } from "youtube-player/dist/types";

const Home = () => {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [progress, setProgress] = useState(0);

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

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setVideoId((event.target as HTMLInputElement).value);
    }
  };

  const onSliderValueChange = (value: number[]) => {
    setStart(value[0]);
    setEnd(value[1]);

    console.debug(value);
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

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <div>Enter video ID</div>
      <input
        type="text"
        defaultValue={videoId}
        onKeyDown={onKeyDown}
        className="rounded-2xl bg-white p-2 text-black"
      />

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
          onValueChange={onSliderValueChange}
          className="absolute z-10"
        />

        <Progress value={progress} className="h-2" />
      </div>

      <div className="mt-10 flex w-full justify-evenly">
        <div className="flex flex-col items-center">
          <Button>Set Start</Button>
          <div>{formatSeconds(start)}</div>
        </div>

        <div className="flex gap-2">
          <Button size="icon">
            <Repeat />
          </Button>
          <Button size="icon">
            <CircleX />
          </Button>
        </div>

        <div className="flex flex-col items-center">
          <Button>Set End</Button>
          <div>{formatSeconds(end)}</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
