"use client";
import { Slider } from "@/components/ui/slider";
import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import { Options, YouTubePlayer } from "youtube-player/dist/types";

const Home = () => {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const opts: Options = {
    height: "390",
    width: "640",
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 1,
      fs: 0,
      iv_load_policy: 3,
    },
  };

  const onReady = async (event: YouTubeEvent) => {
    playerRef.current = event.target;
    playerRef.current.pauseVideo();
    const duration = await playerRef.current.getDuration();
    setVideoDuration(duration);
    setEnd(duration);
  };

  const onStateChange = (event: YouTubeEvent<number>) => {
    console.debug(event.data);
    switch (event.data) {
      /* case PlayerStates.UNSTARTED:
        break; */
      /* case PlayerStates.ENDED:
        playerRef.current?.seekTo(start, true);
        break; */
      case PlayerStates.PLAYING:
        startResetTimer();
        break;
      case PlayerStates.PAUSED:
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
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

  const startResetTimer = async () => {
    if (timerRef.current) {
      console.debug("clearing timeout");
      clearTimeout(timerRef.current);
    }

    if (playerRef.current) {
      const currentTime = await playerRef.current.getCurrentTime();

      console.debug(`setting timeout for ${end - currentTime} seconds`);
      timerRef.current = setTimeout(
        () => {
          playerRef.current?.seekTo(start, true);
        },
        (end - currentTime) * 1000,
      );
    }
  };

  useEffect(() => {
    console.debug("start change:", start);

    const setPlayer = async () => {
      if (playerRef.current) {
        playerRef.current.seekTo(start, true);

        if (
          (await playerRef.current!.getPlayerState()) === PlayerStates.PLAYING
        ) {
          startResetTimer();
        }
      }
    };

    setPlayer();
  }, [start]);

  useEffect(() => {
    console.debug("end change:", end);

    const setPlayer = async () => {
      if (playerRef.current) {
        if (
          (await playerRef.current!.getPlayerState()) === PlayerStates.PLAYING
        ) {
          startResetTimer();
        }
      }
    };

    setPlayer();
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
        className="mb-10"
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
      />

      <Slider
        className="w-3/4"
        value={[start, end]}
        max={videoDuration}
        step={1}
        minStepsBetweenThumbs={1}
        onValueChange={onSliderValueChange}
      />
    </div>
  );
};

export default Home;
