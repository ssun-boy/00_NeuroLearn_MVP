'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatSeconds, extractYouTubeId } from '@/lib/timeUtils';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onTimeSelect?: (seconds: number) => void;
  initialTime?: number;
  height?: number;
}

// YouTube iframe API 타입
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({
  url,
  title,
  onTimeSelect,
  initialTime = 0,
  height = 400,
}: VideoPlayerProps) {
  const [currentTime, setCurrentTimeState] = useState<number>(initialTime);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isYouTubeAPILoaded, setIsYouTubeAPILoaded] = useState<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const isPlayerReadyRef = useRef<boolean>(false); // 플레이어 준비 상태 ref (클로저 문제 해결)
  const userSeekedRef = useRef<boolean>(false); // 사용자가 수동으로 이동했는지 추적
  const lastUserSeekTimeRef = useRef<number>(0); // 사용자가 마지막으로 이동한 시간 (타임스탬프)
  const lastSeekedToRef = useRef<number>(0); // 사용자가 마지막으로 이동한 시간 (초)
  const allowTimeUpdateRef = useRef<boolean>(true); // 시간 업데이트 허용 여부

  // setCurrentTime을 래핑하여 사용자 이동 후 보호
  const setCurrentTime = (time: number, force: boolean = false) => {
    const now = Date.now();
    // 사용자가 최근에 이동한 경우(5초 이내) 자동 업데이트 차단
    if (!force && userSeekedRef.current && (now - lastUserSeekTimeRef.current) < 5000) {
      // 사용자가 이동한 시간과 크게 다르면 무시
      if (Math.abs(time - lastSeekedToRef.current) > 3) {
        return;
      }
    }
    setCurrentTimeState(time);
  };

  const youtubeId = extractYouTubeId(url);
  const isYouTube = !!youtubeId;

  // YouTube iframe API 로드
  useEffect(() => {
    if (!isYouTube) return;

    // 이미 로드되어 있으면 바로 초기화
    if (window.YT && window.YT.Player) {
      setIsYouTubeAPILoaded(true);
      return;
    }

    // YouTube iframe API 스크립트 로드
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsYouTubeAPILoaded(true);
    };
  }, [isYouTube]);

  // initialTime 변경 시 YouTube 플레이어 이동 (초기 로딩 시에만)
  const initialTimeRef = useRef<number>(initialTime);
  const hasInitializedRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (!isYouTube || !isPlayerReady || !youtubePlayerRef.current) return;
    
    // 초기 로딩 시에만 initialTime 적용
    if (!hasInitializedRef.current && initialTimeRef.current === initialTime) {
      hasInitializedRef.current = true;
      userSeekedRef.current = false; // 초기화 시 사용자 이동 플래그 리셋
      const timeoutId = setTimeout(() => {
        try {
          if (youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
            youtubePlayerRef.current.seekTo(initialTime, true);
            setCurrentTime(initialTime, true); // 강제 업데이트
            // 이동 후 정지 상태로 유지
            setTimeout(() => {
              try {
                if (youtubePlayerRef.current && typeof youtubePlayerRef.current.pauseVideo === 'function') {
                  youtubePlayerRef.current.pauseVideo();
                }
              } catch (e) {
                console.error('Failed to pause video:', e);
              }
            }, 100);
          }
        } catch (e) {
          console.error('Failed to seek to initial time:', e);
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
    
    // initialTime이 변경된 경우 (목차 선택 등) - 사용자가 최근에 이동하지 않은 경우에만
    if (hasInitializedRef.current && initialTimeRef.current !== initialTime) {
      // 사용자가 최근에 이동한 경우(2초 이내) 무시
      const now = Date.now();
      if (userSeekedRef.current && (now - lastUserSeekTimeRef.current) < 2000) {
        return;
      }
      
      // 사용자 이동 플래그 리셋 (목차 선택 시 새로운 시작점)
      userSeekedRef.current = false;
      initialTimeRef.current = initialTime;
      const timeoutId = setTimeout(() => {
        try {
          if (youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
            youtubePlayerRef.current.seekTo(initialTime, true);
            setCurrentTime(initialTime, true); // 강제 업데이트
            // 이동 후 정지 상태로 유지
            setTimeout(() => {
              try {
                if (youtubePlayerRef.current && typeof youtubePlayerRef.current.pauseVideo === 'function') {
                  youtubePlayerRef.current.pauseVideo();
                }
              } catch (e) {
                console.error('Failed to pause video:', e);
              }
            }, 100);
          }
        } catch (e) {
          console.error('Failed to seek to initial time:', e);
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [initialTime, isYouTube, isPlayerReady]);

  // YouTube 플레이어 초기화
  useEffect(() => {
    if (!isYouTube || !isYouTubeAPILoaded || !iframeRef.current || !youtubeId) return;

    if (youtubePlayerRef.current) {
      return;
    }

    try {
      youtubePlayerRef.current = new window.YT.Player(iframeRef.current, {
        videoId: youtubeId,
        playerVars: {
          start: initialTime,
          enablejsapi: 1,
          autoplay: 0, // 자동 재생 방지
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            try {
              if (!youtubePlayerRef.current) return;
              
              const duration = youtubePlayerRef.current.getDuration();
              setDuration(duration);
              setIsPlayerReady(true);
              isPlayerReadyRef.current = true; // ref도 업데이트
              
              // onReady 시점의 initialTime 적용 및 정지
              const currentInitialTime = initialTime;
              if (currentInitialTime >= 0 && youtubePlayerRef.current) {
                // 약간의 지연을 두어 플레이어가 완전히 준비되도록 함
                setTimeout(() => {
                  try {
                    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
                      youtubePlayerRef.current.seekTo(currentInitialTime, true);
                      setCurrentTime(currentInitialTime, true); // 강제 업데이트
                      // 정지 상태로 유지 (pauseVideo 사용 - stopVideo는 영상을 처음으로 리셋함)
                      setTimeout(() => {
                        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.pauseVideo === 'function') {
                          youtubePlayerRef.current.pauseVideo();
                        }
                      }, 100);
                    }
                  } catch (e) {
                    console.error('Failed to seek on ready:', e);
                  }
                }, 300);
              } else {
                // initialTime이 0이어도 정지 상태로 유지
                setTimeout(() => {
                  try {
                    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.pauseVideo === 'function') {
                      youtubePlayerRef.current.pauseVideo();
                    }
                  } catch (e) {
                    console.error('Failed to pause video:', e);
                  }
                }, 300);
              }
            } catch (e) {
              console.error('Failed to initialize YouTube player:', e);
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            setIsPlaying(event.data === 1);
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
          },
        },
      });

      // 주기적으로 현재 시간 업데이트
      const interval = setInterval(() => {
        if (youtubePlayerRef.current && isPlayerReady) {
          try {
            // 사용자가 최근에 이동한 경우(3초 이내) 주기적 업데이트 완전히 건너뛰기
            const now = Date.now();
            if (userSeekedRef.current && (now - lastUserSeekTimeRef.current) < 3000) {
              return;
            }
            
            // 3초가 지난 후에도 사용자가 이동한 시간과 크게 다르면 업데이트하지 않음
            if (userSeekedRef.current) {
              if (typeof youtubePlayerRef.current.getCurrentTime === 'function') {
                const time = youtubePlayerRef.current.getCurrentTime();
                if (time !== null && !isNaN(time) && time >= 0) {
                  const floorTime = Math.floor(time);
                  // 사용자가 이동한 시간과 5초 이상 차이나면 업데이트하지 않음 (다른 곳으로 이동한 것으로 간주)
                  if (Math.abs(floorTime - lastSeekedToRef.current) > 5) {
                    return;
                  }
                }
              }
            }
            
            if (typeof youtubePlayerRef.current.getCurrentTime === 'function') {
              const time = youtubePlayerRef.current.getCurrentTime();
              if (time !== null && !isNaN(time) && time >= 0) {
                setCurrentTime(Math.floor(time), false); // 자동 업데이트 (보호 로직 적용)
              }
            }
          } catch (e) {
            // 플레이어가 준비되지 않았을 수 있음
          }
        }
      }, 500);

      return () => {
        clearInterval(interval);
        if (youtubePlayerRef.current) {
          try {
            youtubePlayerRef.current.destroy();
          } catch (e) {
            // 이미 파괴되었을 수 있음
          }
          youtubePlayerRef.current = null;
        }
      };
    } catch (e) {
      console.error('Failed to create YouTube player:', e);
      youtubePlayerRef.current = null;
    }
  }, [isYouTube, isYouTubeAPILoaded, youtubeId, initialTime]);

  // 일반 비디오 이벤트 핸들러
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(video.currentTime), false); // 자동 업데이트
    };

    const handleLoadedMetadata = () => {
      setDuration(Math.floor(video.duration));
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isYouTube, initialTime]);

  // 특정 시간으로 이동
  const seekTo = (seconds: number, shouldStop: boolean = false, isUserAction: boolean = false) => {
    if (isUserAction) {
      userSeekedRef.current = true; // 사용자가 수동으로 이동한 경우 플래그 설정
      lastUserSeekTimeRef.current = Date.now(); // 이동 시간 기록
      lastSeekedToRef.current = seconds; // 이동한 시간 기록
    }
    
    if (isYouTube) {
      if (!youtubePlayerRef.current) {
        console.warn('YouTube player ref is not available');
        return;
      }
      
      // 플레이어가 준비되지 않았을 때 대기 후 재시도
      if (!isPlayerReadyRef.current) {
        if (isUserAction) {
          // 사용자 액션인 경우 플레이어가 준비될 때까지 대기
          const checkReady = setInterval(() => {
            if (isPlayerReadyRef.current && youtubePlayerRef.current) {
              clearInterval(checkReady);
              // 준비되면 이동 실행
              try {
                if (typeof youtubePlayerRef.current.seekTo === 'function') {
                  if (shouldStop) {
                    try {
                      if (typeof youtubePlayerRef.current.pauseVideo === 'function') {
                        youtubePlayerRef.current.pauseVideo();
                      }
                    } catch (e) {
                      // 무시
                    }
                  }
                  youtubePlayerRef.current.seekTo(seconds, true);
                  setCurrentTime(seconds, true);
                  
                  setTimeout(() => {
                    try {
                      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
                        const actualTime = youtubePlayerRef.current.getCurrentTime();
                        if (actualTime !== null && !isNaN(actualTime)) {
                          const finalTime = Math.floor(actualTime);
                          setCurrentTime(finalTime, true);
                          lastSeekedToRef.current = finalTime;
                          lastUserSeekTimeRef.current = Date.now();
                        }
                      }
                    } catch (e) {
                      console.error('Failed to get current time:', e);
                    }
                  }, 200);
                }
              } catch (e) {
                console.error('Failed to seek after ready:', e);
              }
            }
          }, 100);
          
          // 10초 후 타임아웃
          setTimeout(() => clearInterval(checkReady), 10000);
        } else {
          console.warn('YouTube player is not ready yet');
          return;
        }
        return;
      }
      try {
        // 플레이어가 준비되었는지 확인
        if (typeof youtubePlayerRef.current.seekTo === 'function') {
          // 먼저 일시정지 (이동 중 재생 방지)
          if (shouldStop) {
            try {
              if (typeof youtubePlayerRef.current.pauseVideo === 'function') {
                youtubePlayerRef.current.pauseVideo();
              }
            } catch (e) {
              // 무시
            }
          }
          
          // 시간 이동
          youtubePlayerRef.current.seekTo(seconds, true);
          setCurrentTime(seconds, true); // 강제 업데이트
          
          // seekTo 후 실제 시간을 다시 가져와서 타임라인 동기화
          setTimeout(() => {
            try {
              if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
                const actualTime = youtubePlayerRef.current.getCurrentTime();
                if (actualTime !== null && !isNaN(actualTime)) {
                  const finalTime = Math.floor(actualTime);
                  setCurrentTime(finalTime, true); // 강제 업데이트
                  if (isUserAction) {
                    lastSeekedToRef.current = finalTime; // 실제 이동한 시간 업데이트
                    lastUserSeekTimeRef.current = Date.now(); // 시간 업데이트 (다시 기록)
                  }
                  
                  // 정지 상태로 유지 (이미 pauseVideo 호출했지만 확실히)
                  if (shouldStop) {
                    try {
                      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.pauseVideo === 'function') {
                        youtubePlayerRef.current.pauseVideo();
                      }
                    } catch (e) {
                      // 무시
                    }
                  }
                }
              }
            } catch (e) {
              console.error('Failed to get current time:', e);
            }
          }, 200);
        } else {
          console.warn('seekTo function is not available');
        }
      } catch (e) {
        console.error('Failed to seek YouTube video:', e);
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds, true); // 강제 업데이트
      if (shouldStop && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  };

  // 5초 앞으로 이동
  const seekForward = () => {
    if (isYouTube) {
      if (!isPlayerReady || !youtubePlayerRef.current) {
        console.warn('Player is not ready yet');
        return;
      }
      // 현재 시간을 플레이어에서 직접 가져오기
      try {
        const actualCurrentTime = youtubePlayerRef.current.getCurrentTime();
        const current = actualCurrentTime !== null && !isNaN(actualCurrentTime) 
          ? Math.floor(actualCurrentTime) 
          : currentTime;
        const newTime = Math.min(current + 5, duration > 0 ? duration : Infinity);
        seekTo(newTime, true, true); // 정지 상태로 유지, 사용자 액션으로 표시
      } catch (e) {
        console.error('Failed to get current time:', e);
        const newTime = Math.min(currentTime + 5, duration > 0 ? duration : Infinity);
        seekTo(newTime, true, true);
      }
    } else {
      const newTime = Math.min(currentTime + 5, duration || Infinity);
      seekTo(newTime, true, true);
    }
  };

  // 5초 뒤로 이동
  const seekBackward = () => {
    if (isYouTube) {
      if (!isPlayerReady || !youtubePlayerRef.current) {
        console.warn('Player is not ready yet');
        return;
      }
      // 현재 시간을 플레이어에서 직접 가져오기
      try {
        const actualCurrentTime = youtubePlayerRef.current.getCurrentTime();
        const current = actualCurrentTime !== null && !isNaN(actualCurrentTime) 
          ? Math.floor(actualCurrentTime) 
          : currentTime;
        const newTime = Math.max(current - 5, 0);
        seekTo(newTime, true, true); // 정지 상태로 유지, 사용자 액션으로 표시
      } catch (e) {
        console.error('Failed to get current time:', e);
        const newTime = Math.max(currentTime - 5, 0);
        seekTo(newTime, true, true);
      }
    } else {
      const newTime = Math.max(currentTime - 5, 0);
      seekTo(newTime, true, true);
    }
  };

  // 현재 시간 선택
  const handleSelectCurrentTime = () => {
    if (onTimeSelect) {
      onTimeSelect(currentTime);
    }
  };

  // 재생/일시정지 토글
  const handlePlayPause = () => {
    if (isYouTube) {
      if (youtubePlayerRef.current && isPlayerReady) {
        try {
          if (isPlaying) {
            if (typeof youtubePlayerRef.current.pauseVideo === 'function') {
              youtubePlayerRef.current.pauseVideo();
            }
          } else {
            if (typeof youtubePlayerRef.current.playVideo === 'function') {
              youtubePlayerRef.current.playVideo();
            }
          }
        } catch (e) {
          console.error('Failed to play/pause YouTube video:', e);
        }
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 영상 제목 */}
      {title && (
        <div className="p-3 bg-gray-100 border-b">
          <h3 className="font-medium truncate">{title}</h3>
        </div>
      )}

      {/* 영상 플레이어 */}
      <div 
        className="flex-1 bg-black flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        {isYouTube ? (
          <div id="youtube-player" className="w-full h-full">
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
              title={title || 'YouTube video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            className="max-w-full max-h-full"
          />
        )}
      </div>

      {/* 컨트롤 바 */}
      <div className="p-3 bg-gray-100 border-t">
        <div className="flex items-center justify-between gap-4">
          {/* 현재 시간 표시 */}
          <div className="text-sm">
            <span className="font-mono">
              {formatSeconds(currentTime)} / {formatSeconds(duration || 0)}
            </span>
          </div>

          {/* 재생/일시정지 버튼 */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayPause}
              title={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  일시정지
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  재생
                </>
              )}
            </Button>
          </div>

          {/* 5초 앞/뒤 이동 버튼 */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={seekBackward}
              disabled={currentTime <= 0}
              title="5초 뒤로"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Button>
            <span className="text-sm text-gray-600 px-2">5초</span>
            <Button
              size="sm"
              variant="outline"
              onClick={seekForward}
              disabled={duration > 0 && currentTime >= duration}
              title="5초 앞으로"
            >
              이후
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* 타임라인 매핑 버튼 */}
          {onTimeSelect && (
            <Button size="sm" onClick={handleSelectCurrentTime}>
              타임라인 매핑 ({formatSeconds(currentTime)})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

