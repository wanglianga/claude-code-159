import type { CategoryId, ScenarioId, StorageId } from '@/types'

export interface CategoryMeta {
  id: CategoryId
  name: string
  icon: string
  /** 是否必须整盒未开封 */
  mustSealed: boolean
  note: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'cooling_patch', name: '退热贴', icon: '🧊', mustSealed: true, note: '物理降温，仅辅助使用' },
  { id: 'iodophor', name: '碘伏', icon: '🧴', mustSealed: true, note: '外用消毒，不可内服' },
  { id: 'gauze', name: '纱布', icon: '🩹', mustSealed: true, note: '无菌敷料，需独立包装' },
  { id: 'band_aid', name: '创可贴', icon: '🩹', mustSealed: true, note: '小伤口覆盖保护' },
  { id: 'mask', name: '口罩', icon: '😷', mustSealed: true, note: '一次性使用' },
  { id: 'thermometer_battery', name: '体温计电池', icon: '🔋', mustSealed: true, note: '常见型号 LR41 / CR2032' },
  { id: 'cotton_swab', name: '医用棉签', icon: '🥢', mustSealed: true, note: '外用清洁' },
  { id: 'medical_tape', name: '医用胶带', icon: '🩺', mustSealed: true, note: '固定敷料' },
  { id: 'saline', name: '生理盐水（外用）', icon: '💧', mustSealed: true, note: '仅外用冲洗' },
  { id: 'gloves', name: '一次性手套', icon: '🧤', mustSealed: true, note: '护理防护' },
  { id: 'other', name: '其他未拆封耗材', icon: '📦', mustSealed: true, note: '需志愿者人工重点核对' }
]

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? '其他'
}

export function categoryIcon(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.icon ?? '📦'
}

export interface ScenarioMeta {
  id: ScenarioId
  name: string
  icon: string
  desc: string
  categories: CategoryId[]
  safety: string
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'fever_night',
    name: '孩子夜间发烧',
    icon: '🌙',
    desc: '退热贴、体温计电池等应急物品',
    categories: ['cooling_patch', 'thermometer_battery'],
    safety: '退热贴仅为物理降温辅助。体温超过 38.5℃、持续高热或精神萎靡，请立即就医，不要依赖共享物品拖延。'
  },
  {
    id: 'wound_elderly',
    name: '老人小伤口处理',
    icon: '🩹',
    desc: '碘伏、纱布、创可贴、棉签等清创用品',
    categories: ['iodophor', 'gauze', 'band_aid', 'cotton_swab', 'medical_tape', 'saline', 'gloves'],
    safety: '伤口较深、出血不止、被生锈物品划伤或出现红肿化脓，请及时就医并评估破伤风风险。'
  },
  {
    id: 'mask_emergency',
    name: '临时缺口罩',
    icon: '😷',
    desc: '临时出门、就医途中急需口罩',
    categories: ['mask', 'gloves'],
    safety: '口罩为一次性用品，请勿重复使用；出现呼吸道症状请佩戴口罩并尽快就医。'
  },
  {
    id: 'home_care',
    name: '居家护理缺耗材',
    icon: '🏠',
    desc: '纱布、胶带、手套等居家护理耗材',
    categories: ['gauze', 'medical_tape', 'cotton_swab', 'saline', 'gloves', 'band_aid', 'iodophor'],
    safety: '居家护理不能替代专业医疗护理，病情变化请及时联系社区卫生服务中心或就医。'
  }
]

export function scenarioName(id: ScenarioId): string {
  return SCENARIOS.find((s) => s.id === id)?.name ?? ''
}

export const STORAGES: { id: StorageId; name: string; desc: string }[] = [
  { id: 'room_dry', name: '常温干燥', desc: '室内常温、避免潮湿' },
  { id: 'cool_dry', name: '阴凉干燥', desc: '避光、不超过 20℃ 阴凉处' },
  { id: 'refrigerated', name: '冷藏（2-8℃）', desc: '冷链物品不能进入共享' }
]

export function storageName(id: StorageId): string {
  return STORAGES.find((s) => s.id === id)?.name ?? id
}

/** 处方药 / 口服药等高风险关键词：命中即禁止登记 */
export const BANNED_PATTERN =
  /(处方|口服|胶囊|药片|片剂|冲剂|糖浆|口服液|注射|针剂|胰岛素|抗生素|降压|降糖|安眠|激素|布洛芬|对乙酰氨基酚|感冒灵|头孢|阿莫西林|疫苗)/

/** 禁入共享的三类物品说明 */
export const BANNED_RULES = [
  { icon: '💊', title: '处方药、口服药', desc: '任何处方药与口服药品一律不得共享，用药必须遵医嘱。' },
  { icon: '📦', title: '已拆封的药品和耗材', desc: '拆封后无法保证无菌与完整，存在污染和误用风险。' },
  { icon: '❄️', title: '需冷链保存的药品', desc: '胰岛素、疫苗等冷链药品脱离温控即失效甚至有害。' }
]

export interface BanCheckResult {
  banned: boolean
  reasons: string[]
}

/** 登记时的禁入校验 */
export function checkBanned(input: {
  name: string
  storage: StorageId
  sealedNew: boolean
  category: CategoryId
}): BanCheckResult {
  const reasons: string[] = []
  if (BANNED_PATTERN.test(input.name)) {
    reasons.push('品名疑似处方药或口服药，处方药、口服药不能进入共享')
  }
  if (input.storage === 'refrigerated') {
    reasons.push('需冷藏（冷链）保存的物品不能进入共享')
  }
  if (!input.sealedNew) {
    reasons.push('已拆封的物品不能进入共享，请登记整盒未开封物品')
  }
  return { banned: reasons.length > 0, reasons }
}

export const DISCLAIMER_SHORT = '共享物品不替代就医，社区仅做物品流转与风险提醒，不提供诊断建议。'

export const DISCLAIMER_FULL =
  '本平台仅帮助邻里流转未拆封的常备用品并提示风险，不构成任何诊断、用药或治疗建议。借用前请自行核对品名、规格、效期与包装状态；症状严重、持续不缓解或出现不适反应，请立即停止使用并及时就医。'
