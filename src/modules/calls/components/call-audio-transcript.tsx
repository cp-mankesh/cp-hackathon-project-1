"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatTimestamp, resolveTranscriptSegments, type TranscriptSegment } from "@/modules/calls/lib/transcript-segments";

type Props = {
  audioSrc: string;
  segmentsJson: unknown;
  fullText: string;
  durationSec: number | null;
};

export function CallAudioTranscript({ audioSrc, segmentsJson, fullText, durationSec }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const segments = useMemo(
    () => resolveTranscriptSegments(segmentsJson, fullText, durationSec),
    [segmentsJson, fullText, durationSec],
  );

  const seekTo = useCallback((sec: number) => {
    const el = audioRef.current;
    if (!el) return;
    const max =
      Number.isFinite(el.duration) && el.duration > 0 ? Math.max(0, el.duration - 0.05) : Number.POSITIVE_INFINITY;
    el.currentTime = Math.min(Math.max(0, sec), max);
    void el.play().catch(() => {});
  }, []);

  const seekBy = useCallback((deltaSec: number) => {
    const el = audioRef.current;
    if (!el) return;
    const base = Number.isFinite(el.currentTime) ? el.currentTime : 0;
    const max =
      Number.isFinite(el.duration) && el.duration > 0 ? Math.max(0, el.duration - 0.05) : Number.POSITIVE_INFINITY;
    el.currentTime = Math.min(Math.max(0, base + deltaSec), max);
  }, []);

  const togglePlayPause = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onDur = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("durationchange", onDur);
    el.addEventListener("loadedmetadata", onDur);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("durationchange", onDur);
      el.removeEventListener("loadedmetadata", onDur);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [audioSrc]);

  const activeIndex = useMemo(() => {
    const t = currentTime;
    const n = segments.length;
    if (n === 0) return -1;
    return segments.findIndex((s, i) => {
      if (i === n - 1) return t >= s.start;
      return t >= s.start && t < s.end;
    });
  }, [segments, currentTime]);

  if (!fullText.trim()) {
    return (
      <>
        <RecordingCard
          audioRef={audioRef}
          audioSrcUrl={audioSrc}
          duration={duration}
          currentTime={currentTime}
          playing={playing}
          onSeekTo={seekTo}
          onSeekBy={seekBy}
          onTogglePlayPause={togglePlayPause}
        />
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Full text of the conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Transcript not available yet.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <RecordingCard
        audioRef={audioRef}
        audioSrcUrl={audioSrc}
        duration={duration}
        currentTime={currentTime}
        playing={playing}
        onSeekTo={seekTo}
        onSeekBy={seekBy}
        onTogglePlayPause={togglePlayPause}
      />

      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>
            Click a timestamp to jump to that moment in the recording. Highlight follows playback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[min(420px,55vh)] w-full rounded-md border p-4">
            {segments.length === 0 ? (
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{fullText}</p>
            ) : (
              <ul className="space-y-3">
                {segments.map((seg, i) => (
                  <TranscriptLine
                    key={`${seg.start}-${i}`}
                    segment={seg}
                    active={i === activeIndex}
                    onSeek={seekTo}
                  />
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}

function RecordingCard({
  audioRef,
  audioSrcUrl,
  duration,
  currentTime,
  playing,
  onSeekTo,
  onSeekBy,
  onTogglePlayPause,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioSrcUrl: string;
  duration: number;
  currentTime: number;
  playing: boolean;
  onSeekTo: (sec: number) => void;
  onSeekBy: (deltaSec: number) => void;
  onTogglePlayPause: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recording</CardTitle>
        <CardDescription>Original audio (authenticated stream)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <audio ref={audioRef} controls className="w-full max-w-xl" src={audioSrcUrl} preload="metadata">
          <track kind="captions" />
        </audio>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onSeekTo(0)}>
            Restart
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onSeekBy(-10)}>
            -10s
          </Button>
          <Button type="button" size="sm" onClick={onTogglePlayPause}>
            {playing ? "Pause" : "Play"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onSeekBy(10)}>
            +10s
          </Button>
        </div>
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 1}
          step={0.1}
          value={Math.min(currentTime, duration > 0 ? duration : 1)}
          onChange={(e) => onSeekTo(Number(e.target.value))}
          className="h-2 w-full accent-primary"
          aria-label="Seek audio timeline"
        />
        <p className="text-muted-foreground text-xs tabular-nums">
          Position {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
        </p>
      </CardContent>
    </Card>
  );
}

function TranscriptLine({
  segment,
  active,
  onSeek,
}: {
  segment: TranscriptSegment;
  active: boolean;
  onSeek: (sec: number) => void;
}) {
  return (
    <li
      className={cn(
        "flex gap-3 rounded-md border border-transparent px-2 py-1.5 text-sm leading-relaxed transition-colors",
        active && "border-border bg-muted/50",
      )}
    >
      <button
        type="button"
        onClick={() => onSeek(segment.start)}
        className={cn(
          "shrink-0 rounded-md px-2 py-0.5 font-mono text-xs tabular-nums transition-colors",
          "bg-muted/80 text-foreground hover:bg-primary/15 hover:text-primary",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        )}
        title="Play from this time"
      >
        {formatTimestamp(segment.start)}
      </button>
      <div className="min-w-0 flex-1 whitespace-pre-wrap">
        {segment.speaker ? (
          <span
            className={cn(
              "mr-2 text-xs font-medium uppercase tracking-wide",
              segment.speaker === "agent" ? "text-primary" : "text-[var(--chart-3)]",
            )}
          >
            {segment.speaker === "agent" ? "Agent" : "Customer"}
          </span>
        ) : null}
        <p className="inline">
          {segment.text.replace(/^\[(Agent|Customer)\]\s*/i, "")}
        </p>
      </div>
    </li>
  );
}
