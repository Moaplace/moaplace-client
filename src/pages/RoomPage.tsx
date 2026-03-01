import { useEffect } from 'react';
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
        setEntryStep('participant');
      }
    }
  }, [room, entryStep, setEntryStep]);

  const handleRoomPasswordVerify = async (password: string) => {
    const ok = await verifyRoomPassword(password);
    if (ok) {
      setEntryStep('participant');
    }
    return ok;
  };

  const handleParticipantSubmit = async (name: string, pw: string) => {
    const existing = await verifyParticipant(name, pw);
    setNickname(name);
    setParticipantPassword(pw);
    setEntryStep('done');
    if (existing) {
      toast.success(`${name}님, 다시 오셨네요!`);
    }
  };

  const handleMapClick = (x: number, y: number) => {
    if (entryStep !== 'done') return;
    const hasMyMarker = room?.markers.some((m) => m.nickname === nickname);
    if (hasMyMarker) return;

    setPendingLocation({ x, y });
    openLocationSheet();
  };

  const handleLocationConfirm = async () => {
    if (!pendingLocation) return;
    await addMarker({
      nickname,
      lat: pendingLocation.y,
      lng: pendingLocation.x,
      password: participantPassword,
    });
    closeLocationSheet();
    toast.success('위치가 등록되었어요!');
  };

  const handleRelocate = async () => {
    const myMarker = room?.markers.find((m) => m.nickname === nickname);
    if (myMarker) {
      await deleteMarker(myMarker.id);
      toast.info('기존 위치를 삭제했어요. 새 위치를 찍어주세요');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.info('링크가 복사되었어요! 친구들에게 공유해보세요');
    } catch {
      toast.error('링크 복사에 실패했어요');
    }
  };

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

      <MapActionBar
        onLocate={() => {
          if (entryStep !== 'done') return;
          toast.info('지도를 탭하여 위치를 찍어주세요');
        }}
        onShare={handleShare}
        onRelocate={handleRelocate}
        hasMyMarker={hasMyMarker}
      />

      <ResultPanel
        markers={room.markers}
        myNickname={nickname}
      />

      {/* 입장 모달 */}
      <EntryModal
        open={entryStep === 'room_password' || entryStep === 'participant'}
        step={entryStep === 'room_password' ? 'room_password' : 'participant'}
        hasRoomPassword={!!room.password}
        onRoomPasswordVerify={handleRoomPasswordVerify}
        onParticipantSubmit={handleParticipantSubmit}
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
