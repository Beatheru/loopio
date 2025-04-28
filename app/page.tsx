"use client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { formatSeconds, isValidYoutubeVideoID } from "@/lib/utils";
import { CircleX, Repeat } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { Options, YouTubePlayer } from "youtube-player/dist/types";

const YOUTUBE_REGEX =
  /^(?:(?:http(?:s)?):\/\/)?(?:(?:www|m)\.)?(?:youtube\.com|youtu.be)\/watch\?v=?([\w\-]{11})(?:\S+)?$/;

const Home = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [inputError, setInputError] = useState<string>("");
  const [speed, setSpeed] = useState(1.0);
  const [paused, setPaused] = useState(true);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const loopRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const endRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(true);

  const videoId = searchParams.get("videoId") || "dQw4w9WgXcQ";

  const opts: Options = {
    height: "100%",
    width: "100%",
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
      fs: 0,
      iv_load_policy: 3,
    },
  };

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    seek(start);
    const duration = playerRef.current.getDuration();
    setVideoDuration(duration);
    if (end === 0) {
      setEnd(duration);
    }

    progressRef.current = requestAnimationFrame(checkProgress);
  };

  const onStateChange = (event: YouTubeEvent<number>) => {
    console.debug(event.data);
    switch (event.data) {
      case PlayerStates.PLAYING:
        loopRef.current = requestAnimationFrame(checkLoop);
        setPaused(false);
        break;
      case PlayerStates.PAUSED:
        cancelAnimationFrame(loopRef.current);
        cancelAnimationFrame(progressRef.current);
        setPaused(true);
        break;
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setInputError("");

    if (isValidYoutubeVideoID(input)) {
      setQueryParams(
        {
          videoId: input,
          start: "0",
          end: "0",
        },
        true,
        true,
      );

      setStart(0);
      setEnd(0);

      return;
    }

    const match = input.match(YOUTUBE_REGEX);

    if (match && isValidYoutubeVideoID(match[1])) {
      setQueryParams(
        {
          videoId: match[1],
          start: "0",
          end: "0",
        },
        true,
        true,
      );

      setStart(0);
      setEnd(0);

      return;
    }

    setInputError("Invalid Youtube URL or Video ID");
  };

  const checkLoop = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      if (currentTime >= endRef.current) {
        seek(startRef.current);
      }

      requestAnimationFrame(checkLoop);
    }
  };

  const checkProgress = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      setProgress((currentTime / duration) * 100);
    }

    progressRef.current = requestAnimationFrame(checkProgress);
  };

  const setQueryParams = (
    params: Record<string, string>,
    reset: boolean = false,
    refresh: boolean = false,
  ) => {
    const newParams = new URLSearchParams(
      !reset ? searchParams.toString() : "",
    );
    Object.entries(params).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    router.replace(`?${newParams.toString()}`, { scroll: false });

    if (refresh) {
      cancelAnimationFrame(loopRef.current);
      cancelAnimationFrame(progressRef.current);
    }
  };

  const seek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      if (pausedRef.current) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(loopRef.current);
      cancelAnimationFrame(progressRef.current);
    };
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      seek(start);
    }

    startRef.current = start;
  }, [start]);

  useEffect(() => {
    endRef.current = end;
  }, [end]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
    }
  }, [speed]);

  // On init
  useEffect(() => {
    const start = Number(searchParams.get("start")) || 0;
    const end = Number(searchParams.get("end")) || 0;

    setStart(start);
    setEnd(end);

    setQueryParams({
      start: start.toString(),
      end: end.toString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

            setQueryParams({
              start: value[0].toString(),
              end: value[1].toString(),
            });

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
              seek(start);
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
