import { Ionicons } from '@expo/vector-icons';

export type CleaningTypeKey = 'batch' | 'small' | 'careful' | 'slow' | 'habit';

export type RoutineSpaceKey = 'living' | 'kitchen' | 'closet' | 'bathroom' | 'laundry';

export type RoutinePeriodKey = 'daily' | 'weekly' | 'monthly';

export type RoutineIconName = keyof typeof Ionicons.glyphMap;

export type RoutineSuggestion = {
  description: string;
  icon: RoutineIconName;
  id: string;
  minutes: number;
  title: string;
};

export type AddedRoutinePayload = {
  description: string;
  icon: RoutineIconName;
  id: string;
  meta: string;
  minutes: number;
  period?: RoutinePeriodKey;
  reminderEnabled?: boolean;
  reminderTime?: string;
  spaceKey: string;
  spaceLabel: string;
  title: string;
};

export type RoutineSpace = {
  accent: string;
  ai: Record<CleaningTypeKey, RoutineSuggestion[]>;
  icon: string;
  key: RoutineSpaceKey;
  label: string;
  routines: RoutineSuggestion[];
};

export const cleaningTypeLabels: Record<CleaningTypeKey, string> = {
  batch: '몰아서 해결형',
  careful: '꼼꼼 관리형',
  habit: '생활 습관형',
  slow: '느긋한 자유형',
  small: '틈새 청소형',
};

export const cleaningTypeCaptions: Record<CleaningTypeKey, string> = {
  batch: '한 번 시작했을 때 흐름을 끊지 않고 끝낼 수 있는 루틴을 골랐어요.',
  careful: '순서와 기준이 분명해서 꼼꼼하게 관리하기 좋은 루틴을 골랐어요.',
  habit: '이미 만들어진 습관을 오래 유지할 수 있는 루틴을 골랐어요.',
  slow: '시작 부담이 낮고 금방 끝낼 수 있는 루틴을 먼저 골랐어요.',
  small: '5분 안팎으로 짧게 끝낼 수 있는 루틴을 골랐어요.',
};

export const routinePeriodOptions: Array<{
  emoji: string;
  key: RoutinePeriodKey;
  label: string;
  range: string;
}> = [
  { emoji: '☀️', key: 'daily', label: '매일', range: '매일 실행' },
  { emoji: '📅', key: 'weekly', label: '주간', range: '주 1~2회' },
  { emoji: '🗓️', key: 'monthly', label: '월간', range: '월 1~2회' },
];

export const routinePeriodLabels: Record<RoutinePeriodKey, string> = {
  daily: '매일',
  weekly: '주간',
  monthly: '월간',
};

const livingRoutines: RoutineSuggestion[] = [
  {
    description: '바닥의 먼지와 머리카락을 가볍게 치워 쾌적한 거실을 만들어요.',
    icon: 'sparkles-outline',
    id: 'living-floor-dust',
    minutes: 10,
    title: '거실 바닥 먼지 닦기',
  },
  {
    description: '쿠션을 세우고 담요를 접어두면 거실이 바로 정돈돼 보여요.',
    icon: 'albums-outline',
    id: 'living-cushion-reset',
    minutes: 3,
    title: '소파 쿠션 정리',
  },
  {
    description: '창문을 열어 공기를 바꾸면 짧은 시간에도 집 분위기가 달라져요.',
    icon: 'cloudy-outline',
    id: 'living-airing',
    minutes: 5,
    title: '창문 열어 환기하기',
  },
  {
    description: '리모컨과 TV 주변의 먼지를 닦아 자주 만지는 곳을 깨끗하게 해요.',
    icon: 'tv-outline',
    id: 'living-tv-dust',
    minutes: 5,
    title: 'TV 주변 먼지 닦기',
  },
  {
    description: '흩어진 소품을 제자리에 두면 바닥과 테이블이 한결 넓어 보여요.',
    icon: 'cube-outline',
    id: 'living-item-reset',
    minutes: 5,
    title: '거실 소품 제자리 정리',
  },
  {
    description: '테이블 위 컵과 종이를 치워 바로 사용할 수 있는 공간을 만들어요.',
    icon: 'reader-outline',
    id: 'living-table-clear',
    minutes: 4,
    title: '거실 테이블 비우기',
  },
  {
    description: '러그 위 먼지를 털어내면 발밑 촉감과 공기가 한결 좋아져요.',
    icon: 'grid-outline',
    id: 'living-rug-shake',
    minutes: 6,
    title: '러그 먼지 털기',
  },
  {
    description: '콘센트 주변 케이블을 묶어 바닥 청소가 쉬운 상태로 만들어요.',
    icon: 'git-compare-outline',
    id: 'living-cable-tidy',
    minutes: 5,
    title: '전선 정리하기',
  },
  {
    description: '책과 잡지를 한곳에 모아 거실의 시야를 깔끔하게 정리해요.',
    icon: 'book-outline',
    id: 'living-books-stack',
    minutes: 4,
    title: '책과 잡지 정돈',
  },
  {
    description: '문 손잡이와 스위치를 닦아 자주 만지는 곳을 산뜻하게 해요.',
    icon: 'hand-left-outline',
    id: 'living-switch-wipe',
    minutes: 3,
    title: '스위치와 손잡이 닦기',
  },
  {
    description: '화분 주변 잎과 흙을 정리해 작은 먼지 쌓임을 줄여요.',
    icon: 'flower-outline',
    id: 'living-plant-corner',
    minutes: 4,
    title: '화분 주변 정리',
  },
];

const kitchenRoutines: RoutineSuggestion[] = [
  {
    description: '주방 쓰레기를 버리고 새 봉투를 끼워 냄새를 줄여요.',
    icon: 'trash-outline',
    id: 'kitchen-trash',
    minutes: 2,
    title: '주방 쓰레기 버리기',
  },
  {
    description: '싱크대 물기를 닦아 물때가 생기기 전에 마무리해요.',
    icon: 'water-outline',
    id: 'kitchen-sink-dry',
    minutes: 3,
    title: '싱크대 물기 닦기',
  },
  {
    description: '요리 후 바로 닦으면 기름때가 굳지 않아 훨씬 쉬워요.',
    icon: 'flame-outline',
    id: 'kitchen-stove-clean',
    minutes: 8,
    title: '가스레인지 닦기',
  },
  {
    description: '배수구를 비우고 물로 헹궈 냄새와 막힘을 예방해요.',
    icon: 'filter-outline',
    id: 'kitchen-drain-clean',
    minutes: 5,
    title: '싱크대 배수구 청소',
  },
  {
    description: '유통기한이 지난 식재료를 골라내 냉장고 공간을 확보해요.',
    icon: 'snow-outline',
    id: 'kitchen-fridge-check',
    minutes: 10,
    title: '냉장고 유통기한 체크',
  },
  {
    description: '조리대 위 물건을 치우고 한 번 닦아 요리 준비를 편하게 해요.',
    icon: 'restaurant-outline',
    id: 'kitchen-counter-reset',
    minutes: 5,
    title: '조리대 정리하기',
  },
  {
    description: '전자레인지 안쪽을 닦아 냄새와 음식 튐 자국을 줄여요.',
    icon: 'radio-outline',
    id: 'kitchen-microwave-wipe',
    minutes: 6,
    title: '전자레인지 안쪽 닦기',
  },
  {
    description: '식탁 위를 비우고 닦아 식사 전후가 더 편해지게 만들어요.',
    icon: 'tablet-landscape-outline',
    id: 'kitchen-table-wipe',
    minutes: 4,
    title: '식탁 닦기',
  },
  {
    description: '컵과 접시를 제자리에 넣어 싱크대 주변을 넓게 써요.',
    icon: 'cafe-outline',
    id: 'kitchen-dishes-return',
    minutes: 6,
    title: '그릇 제자리 넣기',
  },
  {
    description: '양념통 겉면을 닦고 자주 쓰는 순서대로 세워두어요.',
    icon: 'flask-outline',
    id: 'kitchen-spice-reset',
    minutes: 5,
    title: '양념통 정리',
  },
  {
    description: '냉장고 문 손잡이를 닦아 끈적임과 손자국을 없애요.',
    icon: 'hand-left-outline',
    id: 'kitchen-fridge-handle',
    minutes: 3,
    title: '냉장고 손잡이 닦기',
  },
];

const closetRoutines: RoutineSuggestion[] = [
  {
    description: '입은 옷과 깨끗한 옷을 분리하면 다음 정리가 쉬워져요.',
    icon: 'shirt-outline',
    id: 'closet-clothes-sort',
    minutes: 5,
    title: '입은 옷 분류하기',
  },
  {
    description: '빈 옷걸이를 모으고 방향을 맞춰 옷장을 쓰기 편하게 만들어요.',
    icon: 'git-branch-outline',
    id: 'closet-hanger-reset',
    minutes: 4,
    title: '옷걸이 정리하기',
  },
  {
    description: '안 입는 옷 한 벌만 빼도 옷장이 조금씩 가벼워져요.',
    icon: 'archive-outline',
    id: 'closet-one-out',
    minutes: 5,
    title: '안 입는 옷 한 벌 빼기',
  },
  {
    description: '세탁물 바구니를 비우고 색상별로 나누면 빨래 준비가 끝나요.',
    icon: 'basket-outline',
    id: 'closet-laundry-basket',
    minutes: 6,
    title: '세탁물 바구니 비우기',
  },
  {
    description: '옷장 바닥의 먼지를 제거해 옷에 먼지가 묻는 일을 줄여요.',
    icon: 'sparkles-outline',
    id: 'closet-floor-dust',
    minutes: 5,
    title: '옷장 바닥 청소',
  },
  {
    description: '자주 입는 옷을 앞쪽으로 옮겨 아침 준비 시간을 줄여요.',
    icon: 'today-outline',
    id: 'closet-daily-front',
    minutes: 5,
    title: '자주 입는 옷 앞쪽 배치',
  },
  {
    description: '양말을 짝 맞춰 넣어 서랍을 열었을 때 바로 찾을 수 있게 해요.',
    icon: 'ellipse-outline',
    id: 'closet-socks-pair',
    minutes: 6,
    title: '양말 짝 맞추기',
  },
  {
    description: '가방 안 영수증과 작은 물건을 비워 외출 준비를 가볍게 해요.',
    icon: 'bag-handle-outline',
    id: 'closet-bag-empty',
    minutes: 5,
    title: '가방 속 비우기',
  },
  {
    description: '계절이 지난 소품을 한곳에 모아 옷장 공간을 넓혀요.',
    icon: 'archive-outline',
    id: 'closet-season-items',
    minutes: 8,
    title: '계절 소품 모으기',
  },
  {
    description: '서랍 한 칸만 비우고 다시 넣어 부담 없이 정돈해요.',
    icon: 'file-tray-outline',
    id: 'closet-drawer-one',
    minutes: 7,
    title: '서랍 한 칸 정리',
  },
  {
    description: '옷장 문과 손잡이를 닦아 손이 자주 닿는 곳을 깨끗하게 해요.',
    icon: 'hand-left-outline',
    id: 'closet-handle-wipe',
    minutes: 3,
    title: '옷장 손잡이 닦기',
  },
];

const bathroomRoutines: RoutineSuggestion[] = [
  {
    description: '세면대 물기를 바로 닦으면 물때가 굳기 전에 끝낼 수 있어요.',
    icon: 'water-outline',
    id: 'bathroom-sink',
    minutes: 3,
    title: '세면대 물기 닦기',
  },
  {
    description: '바닥 물기를 제거해 미끄러움을 줄이고 욕실을 보송하게 유지해요.',
    icon: 'footsteps-outline',
    id: 'bathroom-floor-dry',
    minutes: 4,
    title: '욕실 바닥 물기 제거',
  },
  {
    description: '거울의 물 튄 자국을 닦아 욕실이 밝아 보이게 만들어요.',
    icon: 'scan-outline',
    id: 'bathroom-mirror',
    minutes: 3,
    title: '거울 닦기',
  },
  {
    description: '변기 안쪽을 빠르게 닦고 물을 내려 위생감을 높여요.',
    icon: 'ellipse-outline',
    id: 'bathroom-toilet',
    minutes: 7,
    title: '변기 청소',
  },
  {
    description: '젖은 수건을 새 수건으로 바꿔 욕실 냄새를 줄여요.',
    icon: 'refresh-outline',
    id: 'bathroom-towel-change',
    minutes: 3,
    title: '수건 교체하기',
  },
  {
    description: '샴푸와 바디워시 병 밑 물기를 닦아 미끄러운 자국을 줄여요.',
    icon: 'beaker-outline',
    id: 'bathroom-bottle-bottoms',
    minutes: 4,
    title: '욕실 용기 밑 닦기',
  },
  {
    description: '배수구 머리카락을 걷어내 물 빠짐을 좋게 만들어요.',
    icon: 'filter-outline',
    id: 'bathroom-drain-hair',
    minutes: 5,
    title: '배수구 머리카락 제거',
  },
  {
    description: '칫솔꽂이를 헹구고 물기를 닦아 위생적으로 유지해요.',
    icon: 'medical-outline',
    id: 'bathroom-toothbrush-cup',
    minutes: 4,
    title: '칫솔꽂이 세척',
  },
  {
    description: '샤워부스 벽의 물자국을 닦아 뿌연 얼룩을 줄여요.',
    icon: 'grid-outline',
    id: 'bathroom-shower-wall',
    minutes: 7,
    title: '샤워부스 벽 닦기',
  },
  {
    description: '휴지와 비누를 채워 욕실을 바로 쓰기 편한 상태로 만들어요.',
    icon: 'cube-outline',
    id: 'bathroom-supplies-refill',
    minutes: 3,
    title: '욕실 소모품 채우기',
  },
  {
    description: '문 손잡이와 수전 주변 손자국을 닦아 반짝이는 느낌을 더해요.',
    icon: 'hand-left-outline',
    id: 'bathroom-faucet-handle',
    minutes: 4,
    title: '수전과 손잡이 닦기',
  },
];

const laundryRoutines: RoutineSuggestion[] = [
  {
    description: '세탁물을 넣고 버튼만 눌러 오늘의 큰 일을 가볍게 시작해요.',
    icon: 'shirt-outline',
    id: 'laundry-start',
    minutes: 5,
    title: '빨래 돌리기',
  },
  {
    description: '마른 빨래를 바로 개면 구김이 줄고 공간도 금방 정리돼요.',
    icon: 'layers-outline',
    id: 'laundry-fold',
    minutes: 10,
    title: '빨래 개기',
  },
  {
    description: '세제와 섬유유연제를 채워두면 다음 세탁이 편해져요.',
    icon: 'beaker-outline',
    id: 'laundry-detergent-refill',
    minutes: 3,
    title: '세제 채워두기',
  },
  {
    description: '먼지망을 비워 건조 효율을 높이고 냄새를 줄여요.',
    icon: 'funnel-outline',
    id: 'laundry-filter-clean',
    minutes: 4,
    title: '건조기 먼지망 비우기',
  },
  {
    description: '월 1회 통 세척으로 세탁기 냄새를 예방해요.',
    icon: 'sync-outline',
    id: 'laundry-tub-clean',
    minutes: 5,
    title: '세탁기 통 세척',
  },
  {
    description: '세탁 전 색상과 소재를 나눠 옷 손상을 줄여요.',
    icon: 'color-palette-outline',
    id: 'laundry-color-sort',
    minutes: 6,
    title: '빨래 색상 분류',
  },
  {
    description: '젖은 수건을 따로 모아 냄새가 번지는 일을 줄여요.',
    icon: 'water-outline',
    id: 'laundry-wet-towels',
    minutes: 3,
    title: '젖은 수건 분리',
  },
  {
    description: '건조대 빈자리를 만들고 마른 옷을 먼저 걷어 정리해요.',
    icon: 'reorder-three-outline',
    id: 'laundry-rack-clear',
    minutes: 6,
    title: '건조대 자리 만들기',
  },
  {
    description: '세탁실 바닥의 먼지와 세제 가루를 닦아 미끄러움을 줄여요.',
    icon: 'sparkles-outline',
    id: 'laundry-floor-wipe',
    minutes: 5,
    title: '세탁실 바닥 닦기',
  },
  {
    description: '세제통 주변을 닦고 남은 양을 확인해 다음 세탁을 준비해요.',
    icon: 'flask-outline',
    id: 'laundry-shelf-reset',
    minutes: 4,
    title: '세제 선반 정리',
  },
  {
    description: '수건을 크기별로 개어 꺼내기 쉬운 상태로 정돈해요.',
    icon: 'layers-outline',
    id: 'laundry-towel-stack',
    minutes: 7,
    title: '수건 접어 쌓기',
  },
];

export const routineSpaces: RoutineSpace[] = [
  {
    accent: '#4F785E',
    ai: {
      batch: [livingRoutines[0], livingRoutines[4], livingRoutines[3]],
      careful: [livingRoutines[3], livingRoutines[0], livingRoutines[4]],
      habit: [livingRoutines[2], livingRoutines[1], livingRoutines[0]],
      slow: [livingRoutines[1], livingRoutines[2], livingRoutines[4]],
      small: [livingRoutines[1], livingRoutines[2], livingRoutines[4]],
    },
    icon: '🛋️',
    key: 'living',
    label: '거실',
    routines: livingRoutines,
  },
  {
    accent: '#986B38',
    ai: {
      batch: [kitchenRoutines[2], kitchenRoutines[3], kitchenRoutines[4]],
      careful: [kitchenRoutines[3], kitchenRoutines[2], kitchenRoutines[4]],
      habit: [kitchenRoutines[0], kitchenRoutines[1], kitchenRoutines[3]],
      slow: [kitchenRoutines[0], kitchenRoutines[1], kitchenRoutines[3]],
      small: [kitchenRoutines[0], kitchenRoutines[1], kitchenRoutines[3]],
    },
    icon: '🍳',
    key: 'kitchen',
    label: '주방',
    routines: kitchenRoutines,
  },
  {
    accent: '#8A6575',
    ai: {
      batch: [closetRoutines[0], closetRoutines[3], closetRoutines[4]],
      careful: [closetRoutines[1], closetRoutines[4], closetRoutines[0]],
      habit: [closetRoutines[0], closetRoutines[1], closetRoutines[3]],
      slow: [closetRoutines[2], closetRoutines[0], closetRoutines[1]],
      small: [closetRoutines[0], closetRoutines[1], closetRoutines[2]],
    },
    icon: '👗',
    key: 'closet',
    label: '옷장',
    routines: closetRoutines,
  },
  {
    accent: '#3E7892',
    ai: {
      batch: [bathroomRoutines[1], bathroomRoutines[3], bathroomRoutines[2]],
      careful: [bathroomRoutines[0], bathroomRoutines[2], bathroomRoutines[3]],
      habit: [bathroomRoutines[0], bathroomRoutines[4], bathroomRoutines[1]],
      slow: [bathroomRoutines[0], bathroomRoutines[4], bathroomRoutines[2]],
      small: [bathroomRoutines[0], bathroomRoutines[4], bathroomRoutines[2]],
    },
    icon: '🚿',
    key: 'bathroom',
    label: '화장실',
    routines: bathroomRoutines,
  },
  {
    accent: '#5273A0',
    ai: {
      batch: [laundryRoutines[0], laundryRoutines[1], laundryRoutines[3]],
      careful: [laundryRoutines[3], laundryRoutines[4], laundryRoutines[2]],
      habit: [laundryRoutines[0], laundryRoutines[2], laundryRoutines[3]],
      slow: [laundryRoutines[0], laundryRoutines[2], laundryRoutines[3]],
      small: [laundryRoutines[0], laundryRoutines[2], laundryRoutines[3]],
    },
    icon: '👕',
    key: 'laundry',
    label: '세탁',
    routines: laundryRoutines,
  },
];

export function routineToPayload(
  routine: RoutineSuggestion,
  spaceLabel: string,
  spaceKey: string
): AddedRoutinePayload {
  return {
    description: routine.description,
    icon: routine.icon,
    id: routine.id,
    meta: `${routine.minutes}분 · ${spaceLabel}`,
    minutes: routine.minutes,
    spaceKey,
    spaceLabel,
    title: routine.title,
  };
}

export function getRoutineSpace(spaceKey?: string) {
  return routineSpaces.find((space) => space.key === spaceKey) ?? routineSpaces[0];
}
