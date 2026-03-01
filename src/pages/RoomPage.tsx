import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import MapActionBar from '@/components/Map/MapActionBar';
import MockMapView from '@/components/Map/MockMapView';
import EntryModal from '@/components/Panel/EntryModal';
import LocationConfirmSheet from '@/components/Panel/LocationConfirmSheet';
import ResultPanel from '@/components/Panel/ResultPanel';
import RoomHeader from '@/components/Panel/RoomHeader';
import { useRoomStore } from '@/store/roomStore';
import { useUIStore } from '@/store/uiStore';
import type { ActiveEntryStep } from '@/types';

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
        setEntryStep('nickname');
      }
    }
  }, [room, entryStep, setEntryStep]);

  // --- Entry handlers ---
  const handleRoomPasswordVerify = useCallback(async (password: string) => {
    const ok = await verifyRoomPassword(password);
    if (ok) {
      setEntryStep('nickname');
    }
    return ok;
  }, [verifyRoomPassword, setEntryStep]);

  const handleNicknameSubmit = useCallback((name: string) => {
    setNickname(name);
    setEntryStep('participant_password');
  }, [setNickname, setEntryStep]);

  const handleParticipantPasswordSubmit = useCallback(async (pw: string) => {
    const existing = await verifyParticipant(nickname, pw);
    setParticipantPassword(pw);
    setEntryStep('done');
    if (existing) {
      toast.success(`${nickname}님, 다시 오셨네요!`);
    }
  }, [nickname, verifyParticipant, setParticipantPassword, setEntryStep]);

  // --- Map handlers ---
  const handleMapClick = useCallback((x: number, y: number) => {
    if (entryStep !== 'done') return;
    const hasMyMarker = room?.markers.some((m) => m.nickname === nickname);
    if (hasMyMarker) return;

    setPendingLocation({ x, y });
    openLocationSheet();
  }, [entryStep, room?.markers, nickname, setPendingLocation, openLocationSheet]);

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
    if (entryStep !== 'done') return;
    toast.info('지도를 탭하여 위치를 찍어주세요');
  }, [entryStep]);

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

  const hasMyMarker = room.markers.some((m) => m.nickname === nickname);
  const hasAnyMarker = room.markers.length > 0;
  const entryModalOpen =
    entryStep === 'room_password' ||
    entryStep === 'nickname' ||
    entryStep === 'participant_password';

  const entryModalStep: ActiveEntryStep =
    entryStep === 'room_password'
      ? 'room_password'
      : entryStep === 'nickname'
        ? 'nickname'
        : 'participant_password';

  return (
    <div className="flex flex-col h-[calc(100dvh-32px)]">
      <RoomHeader
        roomName={room.name}
        participantCount={room.markers.length}
      />

      <MockMapView
        markers={room.markers}
        myNickname={nickname}
        onMapClick={handleMapClick}
        className="flex-1 min-h-0"
      />

      {/* 점진적 노출: 마커 상태에 따라 버튼 구성 변경 */}
      <MapActionBar
        onLocate={handleLocate}
        onShare={handleShare}
        onRelocate={handleRelocate}
        hasMyMarker={hasMyMarker}
        showShare={hasAnyMarker}
      />

      {/* 결과 패널: 마커가 있을 때만 */}
      {hasAnyMarker && (
        <ResultPanel
          markers={room.markers}
          myNickname={nickname}
        />
      )}

      {/* 입장 모달 (3단계) */}
      <EntryModal
        open={entryModalOpen}
        step={entryModalStep}
        hasRoomPassword={!!room.password}
        onRoomPasswordVerify={handleRoomPasswordVerify}
        onNicknameSubmit={handleNicknameSubmit}
        onParticipantPasswordSubmit={handleParticipantPasswordSubmit}
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
