import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import EntryGate from '@/components/Panel/EntryGate';
import MapActionBar from '@/components/Map/MapActionBar';
import MockMapView from '@/components/Map/MockMapView';
import LocationConfirmSheet from '@/components/Panel/LocationConfirmSheet';
import ParticipantList from '@/components/Panel/ParticipantList';
import ProfileSheet from '@/components/Panel/ProfileSheet';
import ResultPanel from '@/components/Panel/ResultPanel';
import RoomHeader from '@/components/Panel/RoomHeader';
import { useRoomStore } from '@/store/roomStore';
import { useUIStore } from '@/store/uiStore';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoomStore((s) => s.room);
  const isLoading = useRoomStore((s) => s.isLoading);
  const fetchRoom = useRoomStore((s) => s.fetchRoom);
  const addMarker = useRoomStore((s) => s.addMarker);
  const deleteMarker = useRoomStore((s) => s.deleteMarker);
  const verifyRoomPassword = useRoomStore((s) => s.verifyRoomPassword);
  const verifyParticipant = useRoomStore((s) => s.verifyParticipant);

  const nickname = useUIStore((s) => s.nickname);
  const participantPassword = useUIStore((s) => s.participantPassword);
  const entryStep = useUIStore((s) => s.entryStep);
  const setEntryStep = useUIStore((s) => s.setEntryStep);
  const setNickname = useUIStore((s) => s.setNickname);
  const setParticipantPassword = useUIStore((s) => s.setParticipantPassword);
  const pendingLocation = useUIStore((s) => s.pendingLocation);
  const isLocationSheetOpen = useUIStore((s) => s.isLocationSheetOpen);
  const setPendingLocation = useUIStore((s) => s.setPendingLocation);
  const openLocationSheet = useUIStore((s) => s.openLocationSheet);
  const closeLocationSheet = useUIStore((s) => s.closeLocationSheet);

  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  // 방 데이터 로드
  useEffect(() => {
    if (roomId) {
      fetchRoom(roomId);
    }
  }, [roomId, fetchRoom]);

  // 방 로드 완료 시 입장 단계 시작
  useEffect(() => {
    if (room && entryStep === 'idle') {
      if (room.password) {
        setEntryStep('room_password');
      } else {
        setEntryStep('done');
      }
    }
  }, [room, entryStep, setEntryStep]);

  // --- Entry handlers ---
  const handleRoomPasswordVerify = useCallback(async (password: string) => {
    try {
      const ok = await verifyRoomPassword(password);
      if (ok) {
        setEntryStep('done');
      }
      return ok;
    } catch {
      toast.error('비밀번호 확인에 실패했어요');
      return false;
    }
  }, [verifyRoomPassword, setEntryStep]);

  const needsProfile = !nickname || !participantPassword;

  const handleProfileSubmit = useCallback(async (name: string, pw: string) => {
    try {
      const existing = await verifyParticipant(name, pw);
      setNickname(name);
      setParticipantPassword(pw);
      setIsProfileSheetOpen(false);
      if (existing) {
        toast.success(`${name}님, 다시 오셨네요!`);
      } else {
        toast.success('이제 지도를 탭해서 위치를 찍어주세요!');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '참여에 실패했어요';
      toast.error(message);
      throw err;
    }
  }, [verifyParticipant, setNickname, setParticipantPassword]);

  // --- Map handlers ---
  const handleMapClick = useCallback((x: number, y: number) => {
    if (needsProfile) {
      setIsProfileSheetOpen(true);
      return;
    }
    const hasMyMarker = room?.markers.some((m) => m.nickname === nickname);
    if (hasMyMarker) return;

    setPendingLocation({ x, y });
    openLocationSheet();
  }, [needsProfile, room?.markers, nickname, setPendingLocation, openLocationSheet]);

  const handleLocationConfirm = useCallback(async () => {
    if (!pendingLocation) return;
    await addMarker({
      nickname,
      lat: pendingLocation.y,
      lng: pendingLocation.x,
      password: participantPassword,
    });
    closeLocationSheet();
    toast.success('위치가 등록되었어요!');
  }, [pendingLocation, nickname, participantPassword, addMarker, closeLocationSheet]);

  const handleRelocate = useCallback(async () => {
    const myMarker = room?.markers.find((m) => m.nickname === nickname);
    if (myMarker) {
      await deleteMarker(myMarker.id);
      toast.info('기존 위치를 삭제했어요. 새 위치를 찍어주세요');
    }
  }, [room?.markers, nickname, deleteMarker]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.info('링크가 복사되었어요! 친구들에게 공유해보세요');
    } catch {
      toast.error('링크 복사에 실패했어요');
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (needsProfile) {
      setIsProfileSheetOpen(true);
      return;
    }
    toast.info('지도를 탭하여 위치를 찍어주세요');
  }, [needsProfile]);

  // --- Render ---
  if (isLoading && !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-black-400">불러오는 중...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-error">방을 찾을 수 없어요</p>
      </div>
    );
  }

  // 방 비밀번호 게이트 (비밀번호 있는 방만)
  if (entryStep === 'room_password') {
    return (
      <EntryGate
        roomName={room.name}
        onRoomPasswordVerify={handleRoomPasswordVerify}
      />
    );
  }

  const hasMyMarker = room.markers.some((m) => m.nickname === nickname);
  const hasAnyMarker = room.markers.length > 0;

  return (
    <div className="flex h-dvh bg-background">
      {/* 지도 영역 */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* 헤더: 지도 위 오버레이 */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm rounded-b-2xl mx-3 mt-3 shadow-sm">
            <RoomHeader
              roomName={room.name}
              participantCount={room.markers.length}
            />
          </div>
        </div>

        <MockMapView
          markers={room.markers}
          myNickname={nickname}
          onMapClick={handleMapClick}
          className="flex-1 min-h-0"
        />

        {/* 플로팅 액션 바 */}
        <MapActionBar
          onLocate={handleLocate}
          onShare={handleShare}
          onRelocate={handleRelocate}
          hasMyMarker={hasMyMarker}
          showShare={hasAnyMarker}
        />
      </div>

      {/* 데스크톱 사이드 패널 (1024px+, 마커 있을 때만) */}
      {hasAnyMarker && (
        <div className="hidden lg:flex lg:w-[360px] lg:flex-col lg:border-l lg:border-black-300/50 lg:bg-white lg:overflow-y-auto">
          <div className="p-4 border-b border-black-300/50">
            <RoomHeader
              roomName={room.name}
              participantCount={room.markers.length}
            />
          </div>
          <div className="flex-1 p-4">
            <ParticipantList markers={room.markers} myNickname={nickname} />
          </div>
        </div>
      )}

      {/* 모바일/태블릿 ResultPanel (Drawer) */}
      {hasAnyMarker && (
        <div className="lg:hidden">
          <ResultPanel
            markers={room.markers}
            myNickname={nickname}
          />
        </div>
      )}

      {/* 프로필 입력 Drawer (닉네임+비밀번호 미입력 시 지도 인터랙션에서 열림) */}
      <ProfileSheet
        open={isProfileSheetOpen}
        onSubmit={handleProfileSubmit}
        onClose={() => setIsProfileSheetOpen(false)}
      />

      {pendingLocation && (
        <LocationConfirmSheet
          open={isLocationSheetOpen}
          onConfirm={handleLocationConfirm}
          onCancel={closeLocationSheet}
          x={pendingLocation.x}
          y={pendingLocation.y}
        />
      )}
    </div>
  );
};

export default RoomPage;
